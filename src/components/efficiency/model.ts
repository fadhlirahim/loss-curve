/**
 * The efficiency toolkit, computed honestly at toy scale.
 *
 * One seeded Gaussian weight tensor (256 values) feeds both the quantization
 * and pruning labs: absmax uniform quantization (per-tensor or per-group),
 * magnitude pruning (unstructured and 2:4 semi-structured), and reconstruction
 * RMSE for every setting. The distillation panel applies real temperature
 * softmax to one hand-crafted set of teacher logits. Everything downstream of
 * these constants is genuine arithmetic, computed here.
 */

import { seededRng } from '@/components/neural-net/model'

export const N_WEIGHTS = 256
export const GRID_COLS = 16

const rng = seededRng(1337)
const gaussian = () => {
  // Box–Muller; rng never returns exactly 0
  const u = Math.max(rng(), 1e-12)
  const v = rng()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}

/** The base tensor: N(0, 0.5), fixed seed so SSR and client agree. */
export const WEIGHTS = Array.from({ length: N_WEIGHTS }, () => gaussian() * 0.5)

const absmax = (w: number[]) => Math.max(...w.map(Math.abs))

export const OUTLIER_INDEX = 137
export const OUTLIER_FACTOR = 8
const BASE_ABSMAX = absmax(WEIGHTS)

/** The tensor with one activation-style outlier planted in it. */
export const tensor = (outlier: boolean) =>
  outlier
    ? WEIGHTS.map((w, i) => (i === OUTLIER_INDEX ? OUTLIER_FACTOR * BASE_ABSMAX : w))
    : WEIGHTS

/** Absmax symmetric uniform quantization. groupSize = w.length → per-tensor. */
export function quantize(w: number[], bits: number, groupSize: number): number[] {
  const levels = 2 ** (bits - 1) - 1
  const out: number[] = []
  for (let g = 0; g < w.length; g += groupSize) {
    const group = w.slice(g, g + groupSize)
    const scale = absmax(group) / levels
    for (const v of group) {
      if (scale === 0) {
        out.push(0)
        continue
      }
      const q = Math.max(-levels, Math.min(levels, Math.round(v / scale)))
      out.push(q * scale)
    }
  }
  return out
}

export const rmse = (a: number[], b: number[]) =>
  Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0) / a.length)

export const BITS_RANGE = [2, 3, 4, 5, 6, 7, 8]

/** RMSE at every bit width for the current granularity/outlier setting. */
export const rmseCurve = (groupSize: number, outlier: boolean) => {
  const w = tensor(outlier)
  return BITS_RANGE.map((bits) => ({ bits, rmse: rmse(w, quantize(w, bits, groupSize)) }))
}

/** The representable values of a per-tensor grid — the histogram overlay. */
export const quantLevels = (w: number[], bits: number) => {
  const levels = 2 ** (bits - 1) - 1
  const scale = absmax(w) / levels
  return Array.from({ length: 2 * levels + 1 }, (_, k) => (k - levels) * scale)
}

/** Stored bits per weight including one fp16 scale per group. */
export const effectiveBits = (bits: number, groupSize: number) => bits + 16 / groupSize

/** Memory for a 1B-parameter model at a given bits-per-weight, in GB. */
export const gbAt1B = (bitsPerWeight: number) => bitsPerWeight / 8

/** RMSE over the weights OUTSIDE the outlier's group — shows containment. */
export function rmseOutsideOutlierGroup(bits: number, groupSize: number): number {
  const w = tensor(true)
  const wq = quantize(w, bits, groupSize)
  const gStart = Math.floor(OUTLIER_INDEX / groupSize) * groupSize
  const keep = (_: number, i: number) => i < gStart || i >= gStart + groupSize
  return rmse(w.filter(keep), wq.filter(keep))
}

export type HistBin = { x0: number; x1: number; count: number }

export function histogram(w: number[], nBins: number): HistBin[] {
  const lim = absmax(w)
  const step = (2 * lim) / nBins
  const bins = Array.from({ length: nBins }, (_, i) => ({
    x0: -lim + i * step,
    x1: -lim + (i + 1) * step,
    count: 0,
  }))
  for (const v of w) {
    const i = Math.min(nBins - 1, Math.floor((v + lim) / step))
    bins[i].count++
  }
  return bins
}

/* ── distillation ─────────────────────────────────────────────── */

export const DISTILL_CONTEXT = 'the bird ate the'

/** Hand-crafted teacher logits over next-token candidates. */
export const CANDIDATES = [
  { token: 'worm', logit: 4.6 },
  { token: 'seed', logit: 3.4 },
  { token: 'bread', logit: 2.6 },
  { token: 'apple', logit: 1.9 },
  { token: 'moth', logit: 1.2 },
  { token: 'pebble', logit: -1.5 },
  { token: 'sofa', logit: -3.0 },
]

export function softmaxT(logits: number[], temperature: number): number[] {
  const scaled = logits.map((z) => z / temperature)
  const max = Math.max(...scaled)
  const exps = scaled.map((z) => Math.exp(z - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/** Shannon entropy in bits. The hard one-hot label carries exactly 0. */
export const entropyBits = (p: number[]) =>
  -p.reduce((s, v) => (v > 0 ? s + v * Math.log2(v) : s), 0)

export const HARD_LABEL = CANDIDATES.map((_, i) => (i === 0 ? 1 : 0))

/* ── pruning ──────────────────────────────────────────────────── */

export type Pruned = { w: number[]; mask: boolean[] }

/** Zero the smallest-|w| fraction of weights. mask[i] = true → pruned. */
export function pruneMagnitude(w: number[], sparsity: number): Pruned {
  const nPrune = Math.round(w.length * sparsity)
  const order = w
    .map((v, i) => ({ a: Math.abs(v), i }))
    .sort((p, q) => p.a - q.a)
    .slice(0, nPrune)
  const mask = Array.from({ length: w.length }, () => false)
  for (const { i } of order) mask[i] = true
  return { w: w.map((v, i) => (mask[i] ? 0 : v)), mask }
}

/** 2:4 semi-structured: in every block of 4, keep the 2 largest-|w|. */
export function prune24(w: number[]): Pruned {
  const mask = Array.from({ length: w.length }, () => false)
  for (let b = 0; b < w.length; b += 4) {
    const idx = [0, 1, 2, 3].map((k) => b + k)
    idx.sort((p, q) => Math.abs(w[p]) - Math.abs(w[q]))
    mask[idx[0]] = true
    mask[idx[1]] = true
  }
  return { w: w.map((v, i) => (mask[i] ? 0 : v)), mask }
}

export const SPARSITY_STEPS = Array.from({ length: 20 }, (_, i) => i * 0.05)

export const pruneCurve = (w: number[]) =>
  SPARSITY_STEPS.map((s) => ({ s, rmse: rmse(w, pruneMagnitude(w, s).w) }))

/* ── the ledger ───────────────────────────────────────────────── */

/** 1B params. Decode assumed memory-bound: speedup ≈ compression (rule of thumb). */
export const LEDGER = [
  {
    format: 'bf16',
    bitsPerWeight: '16',
    memory: '2.0 GB',
    speedup: '×1.0',
    risk: 'none — this is the training-precision baseline',
  },
  {
    format: 'int8 (g=32)',
    bitsPerWeight: '8.5',
    memory: '1.06 GB',
    speedup: '≈ ×1.9',
    risk: 'near-lossless on most models',
  },
  {
    format: 'int4 (g=32)',
    bitsPerWeight: '4.5',
    memory: '0.56 GB',
    speedup: '≈ ×3.6',
    risk: 'quality dips; outliers must be handled (GPTQ/AWQ)',
  },
  {
    format: 'int4 + 2:4 sparse',
    bitsPerWeight: '≈ 2.8',
    memory: '≈ 0.35 GB',
    speedup: '≈ ×5.7*',
    risk: 'compounding damage — needs fine-tuning to recover',
  },
]
