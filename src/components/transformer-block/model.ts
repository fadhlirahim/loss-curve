/**
 * The block's three ideas, each reduced to the smallest honest math:
 *
 * 1. Residual stream — a layer is modeled as a single scalar gain g. A bare
 *    stack multiplies: norm_k = g^k (exponential death or explosion). A
 *    residual stack adds a damped edit: x ← x + damp·(g−1)·x, so
 *    norm_k = (1 + damp·(g−1))^k — gentle drift instead. A scalar caricature
 *    of a matrix reality, but the exponent-vs-sum contrast is the true story.
 *
 * 2. Normalization — a real 6-dim vector, really normalized. LayerNorm
 *    centers then scales; RMSNorm only scales. (Learned γ/β omitted: they
 *    re-introduce scale on purpose, after the reset.)
 *
 * 3. The assembled block — a step-through of x → LN → Attn → ⊕ → LN → MLP → ⊕.
 */

const RESIDUAL_DAMP = 0.1

/** Signal magnitude per layer, starting at 1. Length depth+1. */
export const streamNorms = (gain: number, depth: number, residual: boolean) => {
  const factor = residual ? 1 + RESIDUAL_DAMP * (gain - 1) : gain
  return Array.from({ length: depth + 1 }, (_, k) => factor ** k)
}

/** One token's slice of the residual stream, 6 dims wide. */
const BASE_VEC = [1.4, -0.6, 0.3, -1.1, 0.8, -0.2]

export const driftVec = (scale: number, shift: number) => BASE_VEC.map((v) => v * scale + shift)

export const mean = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length

export const std = (v: number[]) => {
  const m = mean(v)
  return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / v.length + 1e-8)
}

export const rms = (v: number[]) => Math.sqrt(v.reduce((a, x) => a + x * x, 0) / v.length + 1e-8)

export const layerNorm = (v: number[]) => {
  const m = mean(v)
  const s = std(v)
  return v.map((x) => (x - m) / s)
}

export const rmsNorm = (v: number[]) => {
  const r = rms(v)
  return v.map((x) => x / r)
}

/** The walkthrough, one ticker entry per piece of the block. */
export const BLOCK_STEPS = [
  {
    id: 'x',
    box: 'x',
    name: 'the stream arrives',
    note: 'One vector per token — the residual stream, carrying everything the layers below have written into it. The block will edit this vector, not replace it. Hold that framing; it is the whole design.',
  },
  {
    id: 'ln1',
    box: 'LN',
    name: 'normalize first',
    note: 'Whatever scale the stream has drifted to, the attention branch receives a clean, unit-scale copy. This is pre-norm (the LN sits inside the branch, GPT-2 onwards) — post-norm, the 2017 original, normalized after the add and needed fragile warmup schedules to train deep. One layout choice, years of stability difference.',
  },
  {
    id: 'attn',
    box: 'attention',
    name: 'attention — the mixer',
    note: 'The only place in the entire network where information crosses token positions ("it" reads from "bird" — the attention lab). Its output is a proposed edit per token, not a new state.',
  },
  {
    id: 'add1',
    box: '⊕',
    name: '⊕ the edit lands',
    note: 'The proposal is added onto the stream. Addition passes gradients through untouched (the backprop lab\'s "+ rule"), so this ⊕-chain is a gradient highway from the loss straight down to layer 1. A bare 48-layer stack puts 48 multiplications in that path instead — see §1 for what that does.',
  },
  {
    id: 'ln2',
    box: 'LN',
    name: 'normalize again',
    note: 'Same trick for the second branch: the MLP gets well-scaled input no matter what the attention edit just did to the stream.',
  },
  {
    id: 'mlp',
    box: 'MLP',
    name: 'MLP — the thinker',
    note: "Expand ~4×, nonlinearity, project back — applied to each position separately, same weights everywhere. No token sees another here. Roughly two-thirds of the block's parameters live in this branch; mixing is cheap, thinking is expensive.",
  },
  {
    id: 'add2',
    box: '⊕',
    name: '⊕ the second edit lands',
    note: 'Two small edits per block: one from mixing across tokens, one from per-token computation. The stream itself flowed through unchanged — both branches only ever added to it.',
  },
  {
    id: 'out',
    box: 'x′',
    name: 'on to the next block',
    note: 'That is the entire block. A GPT is this unit repeated N times (12 in GPT-2 small, 48+ in large models) between an embedding at the bottom and its transpose at the top. No new ideas appear after this page — only repetition and scale.',
  },
]
