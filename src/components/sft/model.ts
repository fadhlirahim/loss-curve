/**
 * SFT & LoRA, at readable scale.
 *
 * §1 renders real chat-template structure with a working loss mask.
 * §2 builds a 16×16 "fine-tune update" ΔW = Σ σᵢ·uᵢvᵢᵀ from six
 * Gram-Schmidt-orthonormalized seeded directions with decaying σ, plus a
 * whisper of noise — because the directions are orthonormal, keeping the
 * top-r terms IS the optimal rank-r approximation (Eckart–Young), so the
 * energy curve below is exact, not estimated.
 * §3 prices full fine-tuning vs LoRA vs QLoRA with the same byte
 * accounting as the GPU-systems lab (16 B per trained param under AdamW
 * mixed precision).
 */

import { seededRng } from '@/components/neural-net/model'

/* ── §1 · chat template & loss mask ─────────────────────────── */

export type TokenKind = 'marker' | 'system' | 'user' | 'response'

export type Chunk = { text: string; kind: TokenKind; trained: boolean }

export type Example = {
  id: string
  label: string
  system: string
  user: string
  assistant: string
  verdict: string
}

export const EXAMPLES: Example[] = [
  {
    id: 'good',
    label: 'a clean pair',
    system: 'You are a concise tutor.',
    user: 'Explain self-attention in one sentence.',
    assistant:
      'Each word broadcasts a question, every earlier word offers an answer, and the match decides who contributes.',
    verdict: 'Clean pair — this is the behavior you are buying, one gradient step at a time.',
  },
  {
    id: 'hedged',
    label: 'a subtly bad pair',
    system: 'You are a concise tutor.',
    user: 'Does attention need positional information?',
    assistant:
      "That's a great question! It's hard to say for sure, but many people think it probably does, in some sense.",
    verdict:
      'The answer is just "yes — QKᵀ is order-blind." Train on this and the model learns that hedging IS assistant behavior.',
  },
  {
    id: 'off-format',
    label: 'an off-format pair',
    system: 'You are a concise tutor.',
    user: 'In one sentence: what does the causal mask do?',
    assistant:
      'Great question. Here are the key points:\n• blocks future tokens\n• keeps training honest\n• enables generation',
    verdict:
      'Asked for one sentence, trained on a bullet list. The dataset is the spec — this spec says instructions are optional.',
  },
]

const words = (text: string, kind: TokenKind, trained: boolean): Chunk[] =>
  text
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => ({ text: w, kind, trained }))

/**
 * Render one example into template chunks. `masked` = the correct practice:
 * gradient only on the response (and its end marker — the model must also
 * learn to stop). Unmasked: everything is trained.
 */
export const templateChunks = (ex: Example, masked: boolean): Chunk[] => {
  const t = !masked // when unmasked, context chunks are trained too
  return [
    { text: '<|im_start|>', kind: 'marker', trained: t },
    { text: 'system', kind: 'marker', trained: t },
    ...words(ex.system, 'system', t),
    { text: '<|im_end|>', kind: 'marker', trained: t },
    { text: '<|im_start|>', kind: 'marker', trained: t },
    { text: 'user', kind: 'marker', trained: t },
    ...words(ex.user, 'user', t),
    { text: '<|im_end|>', kind: 'marker', trained: t },
    { text: '<|im_start|>', kind: 'marker', trained: t },
    { text: 'assistant', kind: 'marker', trained: t },
    ...words(ex.assistant, 'response', true),
    { text: '<|im_end|>', kind: 'marker', trained: true },
  ]
}

export const chunkCounts = (chunks: Chunk[]) => {
  const trained = chunks.filter((c) => c.trained).length
  return { trained, context: chunks.length - trained, total: chunks.length }
}

/* ── §2 · the low-rank update ───────────────────────────────── */

export const D = 16
const COMPONENTS = 6

export const SIGMA = [5, 3, 1.8, 1.0, 0.5, 0.25]

const rng = seededRng(20260704)
const gauss = () => {
  const u = Math.max(rng(), 1e-12)
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng())
}

const gaussVec = () => Array.from({ length: D }, gauss)

const dot = (a: number[], b: number[]) => a.reduce((s, x, i) => s + x * b[i], 0)

const gramSchmidt = (count: number): number[][] => {
  const basis: number[][] = []
  while (basis.length < count) {
    const v = gaussVec()
    for (const b of basis) {
      const p = dot(v, b)
      for (let i = 0; i < D; i++) v[i] -= p * b[i]
    }
    const norm = Math.sqrt(dot(v, v))
    if (norm > 1e-6) basis.push(v.map((x) => x / norm))
  }
  return basis
}

const U = gramSchmidt(COMPONENTS)
const V = gramSchmidt(COMPONENTS)

const zeros = (): number[][] => Array.from({ length: D }, () => Array.from({ length: D }, () => 0))

const addOuter = (m: number[][], sigma: number, u: number[], v: number[]) => {
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < D; j++) m[i][j] += sigma * u[i] * v[j]
  }
}

/** The "full fine-tune update": six directions of signal + a whisper of noise. */
export const DELTA_W: number[][] = (() => {
  const m = zeros()
  SIGMA.forEach((s, k) => {
    addOuter(m, s, U[k], V[k])
  })
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < D; j++) m[i][j] += 0.02 * gauss()
  }
  return m
})()

/** Optimal rank-r approximation: keep the top-r constructed directions. */
export const rankApprox = (r: number): number[][] => {
  const m = zeros()
  SIGMA.slice(0, Math.min(r, COMPONENTS)).forEach((s, k) => {
    addOuter(m, s, U[k], V[k])
  })
  return m
}

const frob2 = (m: number[][]) => m.flat().reduce((s, x) => s + x * x, 0)

export const DELTA_ENERGY = frob2(DELTA_W)

/** Fraction of ΔW's energy explained at rank r: 1 − ‖ΔW − approx‖²/‖ΔW‖². */
export const energyAt = (r: number) => {
  const approx = rankApprox(r)
  let residual = 0
  for (let i = 0; i < D; i++) {
    for (let j = 0; j < D; j++) residual += (DELTA_W[i][j] - approx[i][j]) ** 2
  }
  return 1 - residual / DELTA_ENERGY
}

export const ENERGY_CURVE = Array.from({ length: D }, (_, i) => energyAt(i + 1))

export const MAX_ABS = Math.max(...DELTA_W.flat().map(Math.abs))

export const loraParams = (r: number) => 2 * D * r

export const FULL_PARAMS = D * D

/* ── §3 · what it costs at 1B ───────────────────────────────── */

const GB = 1024 ** 3

/** 1B-class reference config: L=16, d=2048, r=16 on q,k,v,o projections. */
const ADAPTER_PARAMS = 4 * 16 * 2 * 2048 * 16 // 4 matrices × 16 layers × 2dr

export type CostRow = {
  method: string
  trained: string
  oneB: number
  threeB: number
  note: string
}

const STATE_BYTES = 16 // bf16 w + bf16 g + fp32 master + fp32 m + fp32 v
const row = (method: string, trained: string, oneB: number, threeB: number, note: string) => ({
  method,
  trained,
  oneB,
  threeB,
  note,
})

export const COST_ROWS: CostRow[] = [
  row(
    'full fine-tune',
    'every param',
    (1e9 * STATE_BYTES) / GB,
    (3e9 * STATE_BYTES) / GB,
    'optimizer states for every weight',
  ),
  row(
    'LoRA r=16',
    `${(ADAPTER_PARAMS / 1e6).toFixed(1)}M adapters`,
    (1e9 * 2 + ADAPTER_PARAMS * STATE_BYTES) / GB,
    (3e9 * 2 + ADAPTER_PARAMS * 2.4 * STATE_BYTES) / GB,
    'frozen bf16 base + tiny trained states',
  ),
  row(
    'QLoRA r=16',
    `${(ADAPTER_PARAMS / 1e6).toFixed(1)}M adapters`,
    (1e9 * 0.55 + ADAPTER_PARAMS * STATE_BYTES) / GB,
    (3e9 * 0.55 + ADAPTER_PARAMS * 2.4 * STATE_BYTES) / GB,
    '4-bit frozen base (NF4 + scales)',
  ),
]

export const CARD_GB = 24
