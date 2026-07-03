/**
 * The training loop at language scale, miniaturized until every part is
 * visible: a ~250-char corpus, a character BIGRAM language model (one
 * vocab×vocab matrix of logits), cross-entropy loss, minibatch SGD, and a
 * warmup+cosine learning-rate schedule. The training is REAL — the same
 * loop as nanoGPT's train.py with the transformer swapped out for the
 * smallest model that can overfit letter pairs.
 *
 * Everything is seeded (via the neural-net lab's mulberry32) so SSR and
 * client render identically and every run is reproducible.
 */

import { seededRng } from '@/components/neural-net/model'

export const CORPUS =
  'the bird ate the worm. the cat sat on the warm mat. the sun set and the moon ' +
  'rose over the quiet town. a small dog ran down the long road to the sea. the ' +
  'old man read his book by the fire and the rain fell all night. she sang a ' +
  'soft song to the wind and the stars came out one by one.'

const VOCAB = [...new Set(CORPUS)].sort()
export const VOCAB_SIZE = VOCAB.length

/** Loss of pure uniform guessing — where a zeros-initialized model starts. */
export const UNIFORM_LOSS = Math.log(VOCAB_SIZE)

const STOI = new Map(VOCAB.map((ch, i) => [ch, i]))
const IDS = [...CORPUS].map((ch) => STOI.get(ch) ?? 0)

/** Hold out the corpus tail as validation — the exam the model never trains on. */
const SPLIT = Math.floor(IDS.length * 0.85)
export const TRAIN_IDS = IDS.slice(0, SPLIT)
export const VAL_IDS = IDS.slice(SPLIT)

export const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '∞')

// ── batching ─────────────────────────────────────────────────────

type Batch = {
  /** window start offsets into the id stream, one per row */
  starts: number[]
  /** xs[b][t] is the input char id; ys[b][t] is its prediction target */
  xs: number[][]
  ys: number[][]
}

/** Deterministically dice B windows of T chars out of the stream. */
export function sampleBatch(ids: number[], b: number, t: number, tick: number, seed = 1): Batch {
  const rng = seededRng((seed * 100003 + tick * 613 + b * 31 + t * 7) >>> 0)
  const starts = Array.from({ length: b }, () => Math.floor(rng() * (ids.length - t - 1)))
  return {
    starts,
    xs: starts.map((s) => ids.slice(s, s + t)),
    ys: starts.map((s) => ids.slice(s + 1, s + t + 1)),
  }
}

export const idsToChars = (row: number[]) => row.map((i) => VOCAB[i])

// ── the bigram language model ────────────────────────────────────

/** W[current char][next char] = logit. The whole model. */
export type Bigram = number[][]

/** Zeros init: every prediction starts exactly uniform, loss exactly ln(V). */
export const initBigram = (): Bigram =>
  Array.from({ length: VOCAB_SIZE }, () => Array.from({ length: VOCAB_SIZE }, () => 0))

export const copyBigram = (w: Bigram): Bigram => w.map((row) => [...row])

const softmaxRow = (logits: number[]) => {
  const max = Math.max(...logits)
  const exps = logits.map((v) => Math.exp(v - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/**
 * One SGD step on one minibatch: forward (softmax over W[x]), cross-entropy
 * against the next char, gradient, update in place. Returns the batch loss.
 */
export function sgdStep(
  w: Bigram,
  ids: number[],
  b: number,
  t: number,
  lr: number,
  tick: number,
  seed = 1,
): number {
  const { xs, ys } = sampleBatch(ids, b, t, tick, seed)
  const dW = new Map<number, number[]>()
  let loss = 0
  const n = b * t
  for (let bi = 0; bi < b; bi++) {
    for (let ti = 0; ti < t; ti++) {
      const x = xs[bi][ti]
      const y = ys[bi][ti]
      const p = softmaxRow(w[x])
      loss += -Math.log(p[y] + 1e-12)
      const g = dW.get(x) ?? Array.from({ length: VOCAB_SIZE }, () => 0)
      for (let j = 0; j < VOCAB_SIZE; j++) g[j] += p[j]
      g[y] -= 1
      dW.set(x, g)
    }
  }
  for (const [x, g] of dW) {
    for (let j = 0; j < VOCAB_SIZE; j++) w[x][j] -= (lr * g[j]) / n
  }
  return loss / n
}

/** Mean cross-entropy over an entire id stream, no updates — the honest read. */
export function fullLoss(w: Bigram, ids: number[]): number {
  let loss = 0
  for (let i = 0; i < ids.length - 1; i++) {
    const p = softmaxRow(w[ids[i]])
    loss += -Math.log(p[ids[i + 1]] + 1e-12)
  }
  return loss / (ids.length - 1)
}

export const isDiverged = (w: Bigram) => w.some((row) => row.some((v) => !Number.isFinite(v)))

/**
 * The empirical bigram entropy of the training stream — the floor this model
 * class cannot beat no matter how long it trains. Context is the only way down.
 */
export const bigramFloor = (() => {
  const pair = new Map<number, number>()
  const uni = new Map<number, number>()
  for (let i = 0; i < TRAIN_IDS.length - 1; i++) {
    const key = TRAIN_IDS[i] * VOCAB_SIZE + TRAIN_IDS[i + 1]
    pair.set(key, (pair.get(key) ?? 0) + 1)
    uni.set(TRAIN_IDS[i], (uni.get(TRAIN_IDS[i]) ?? 0) + 1)
  }
  let h = 0
  for (const [key, c] of pair) {
    const x = Math.floor(key / VOCAB_SIZE)
    h += c * -Math.log(c / (uni.get(x) ?? 1))
  }
  return h / (TRAIN_IDS.length - 1)
})()

/** Sample `len` chars from the current model, seeded — watch gibberish organize. */
export function generate(w: Bigram, len: number, seed: number): string {
  const rng = seededRng(seed * 48271 + 7)
  let cur = STOI.get(' ') ?? 0
  const out: string[] = []
  for (let i = 0; i < len; i++) {
    const p = softmaxRow(w[cur])
    let r = rng()
    let next = VOCAB_SIZE - 1
    for (let j = 0; j < VOCAB_SIZE; j++) {
      r -= p[j]
      if (r <= 0) {
        next = j
        break
      }
    }
    out.push(VOCAB[next])
    cur = next
  }
  return out.join('')
}

// ── the learning-rate schedule ───────────────────────────────────

export type Schedule = { warmup: number; peak: number; min: number; total: number }

/** Linear warmup to `peak`, then cosine decay to `min` — nanoGPT's exact shape. */
export function lrAt(step: number, s: Schedule): number {
  if (step < s.warmup) return (s.peak * (step + 1)) / s.warmup
  const progress = Math.min(1, (step - s.warmup) / Math.max(1, s.total - s.warmup))
  return s.min + 0.5 * (s.peak - s.min) * (1 + Math.cos(Math.PI * progress))
}

/** Train two zero-init models on IDENTICAL batches: fixed peak LR vs the schedule. */
export function race(
  s: Schedule,
  b: number,
  t: number,
  seed = 7,
): { fixed: number[]; scheduled: number[] } {
  const wFixed = initBigram()
  const wSched = initBigram()
  const fixed: number[] = []
  const scheduled: number[] = []
  for (let step = 0; step < s.total; step++) {
    fixed.push(sgdStep(wFixed, TRAIN_IDS, b, t, s.peak, step, seed))
    scheduled.push(sgdStep(wSched, TRAIN_IDS, b, t, lrAt(step, s), step, seed))
  }
  return { fixed, scheduled }
}

/** Exponential moving average — how noisy per-step losses become a readable curve. */
export function ema(values: number[], alpha = 0.12): number[] {
  const out: number[] = []
  let acc = values[0] ?? 0
  for (const v of values) {
    acc = acc + alpha * (v - acc)
    out.push(acc)
  }
  return out
}

export const STEPS_PER_TICK = 12
export const MAX_STEPS = 4000
export const LAB_T = 8
