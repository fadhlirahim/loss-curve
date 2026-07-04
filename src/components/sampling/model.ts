/**
 * Decoding, with every number visible.
 *
 * One hand-crafted next-token distribution (§1), one tiny word-level Markov
 * chain engineered so greedy decoding provably loops (§2), the pass@k
 * arithmetic that makes decoding params part of any eval claim (§3), and the
 * Leviathan et al. speculative-decoding expectation (§4). The knob pipeline,
 * chain traversal, pass@k, and speculation formulas are the real math; the
 * §3 success-vs-temperature curve is a hand-shaped illustration and says so.
 */

import { seededRng } from '@/components/neural-net/model'

/** Next-token candidates after "The bird ate the …", most to least plausible. */
export const CANDIDATES = [
  'worm',
  'seed',
  'bread',
  'apple',
  'crumb',
  'leaf',
  'fish',
  'moon',
  'sofa',
  'car',
]

/** ln of the intended T=1 probabilities (softmax is shift-invariant). */
const LOGITS = [-0.87, -1.47, -2.21, -2.53, -2.81, -3.22, -3.51, -4.2, -4.61, -5.3]

const softmax = (logits: number[]) => {
  const max = Math.max(...logits)
  const exps = logits.map((l) => Math.exp(l - max))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

export type KnobResult = {
  /** Final probability per candidate (0 for excluded), summing to 1. */
  probs: number[]
  /** Tempered pre-truncation probability per candidate (for ghost bars). */
  tempered: number[]
  kept: boolean[]
  /** Shannon entropy of the final distribution, in bits. */
  entropy: number
}

/** The standard pipeline: temperature → top-k ∩ top-p masks → renormalize. */
export const applyKnobs = (temp: number, topK: number, topP: number): KnobResult => {
  const tempered = softmax(LOGITS.map((l) => l / temp))
  const order = tempered.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p)

  const kept = CANDIDATES.map(() => false)
  let cum = 0
  order.forEach(({ p, i }, rank) => {
    const inTopP = cum < topP // keep until the mass so far reaches p (always ≥ 1 token)
    if (rank < topK && inTopP) kept[i] = true
    cum += p
  })

  const keptMass = tempered.reduce((s, p, i) => s + (kept[i] ? p : 0), 0)
  const probs = tempered.map((p, i) => (kept[i] ? p / keptMass : 0))
  const entropy = -probs.reduce((s, p) => s + (p > 0 ? p * Math.log2(p) : 0), 0)
  return { probs, tempered, kept, entropy }
}

/* ── §2 · the Markov chain ─────────────────────────────────────── */

export const END = '∎'

/** Rows sum to 1. Greedy from "the" enters the → bird → ate → the … forever. */
const CHAIN = new Map<string, [string, number][]>([
  [
    'the',
    [
      ['bird', 0.6],
      ['worm', 0.25],
      ['seed', 0.15],
    ],
  ],
  [
    'bird',
    [
      ['ate', 0.55],
      ['flew', 0.25],
      ['sang', 0.2],
    ],
  ],
  [
    'ate',
    [
      ['the', 0.7],
      ['a', 0.3],
    ],
  ],
  [
    'a',
    [
      ['seed', 0.65],
      ['worm', 0.35],
    ],
  ],
  [
    'seed',
    [
      [END, 0.5],
      ['then', 0.5],
    ],
  ],
  [
    'worm',
    [
      [END, 0.55],
      ['then', 0.45],
    ],
  ],
  [
    'flew',
    [
      ['away', 0.8],
      ['again', 0.2],
    ],
  ],
  [
    'away',
    [
      [END, 0.6],
      ['then', 0.4],
    ],
  ],
  [
    'sang',
    [
      ['loudly', 0.7],
      ['again', 0.3],
    ],
  ],
  [
    'loudly',
    [
      [END, 0.6],
      ['then', 0.4],
    ],
  ],
  [
    'again',
    [
      [END, 0.7],
      ['then', 0.3],
    ],
  ],
  [
    'then',
    [
      ['the', 0.6],
      ['a', 0.4],
    ],
  ],
])

export const WALK_CAP = 12

/** Always picks the argmax next word. Returns the walk and where it started repeating. */
export const greedyWalk = (): { words: string[]; cycleStart: number } => {
  const words = ['the']
  const seen = new Map<string, number>([['the', 0]])
  let cycleStart = -1
  while (words.length < WALK_CAP) {
    const row = CHAIN.get(words[words.length - 1])
    if (!row) break
    const next = row.reduce((best, cand) => (cand[1] > best[1] ? cand : best))[0]
    if (next === END) break
    if (cycleStart === -1 && seen.has(next)) cycleStart = words.length
    if (!seen.has(next)) seen.set(next, words.length)
    words.push(next)
  }
  return { words, cycleStart }
}

/** Samples the chain with temperature (p^(1/T), renormalized per row). */
export const sampleWalk = (seed: number, temp: number): string[] => {
  const rng = seededRng(seed)
  const words = ['the']
  while (words.length < WALK_CAP * 2) {
    const row = CHAIN.get(words[words.length - 1])
    if (!row) break
    const powered = row.map(([, p]) => p ** (1 / temp))
    const total = powered.reduce((a, b) => a + b, 0)
    let r = rng() * total
    let next = row[row.length - 1][0]
    for (let i = 0; i < row.length; i++) {
      r -= powered[i]
      if (r <= 0) {
        next = row[i][0]
        break
      }
    }
    if (next === END) return words
    words.push(next)
  }
  return words
}

/* ── §3 · decoding changes the measured number ─────────────────── */

/**
 * Illustrative per-sample success rate vs temperature: sharp rise to a peak
 * near T=0.7 (greedy commits to one wrong approach), gentle decline after.
 * The SHAPE is hand-drawn; the pass@k arithmetic below it is exact.
 */
export const successRate = (temp: number) => {
  const sigma = temp < 0.7 ? 0.35 : 1.0
  return 0.03 + 0.15 * Math.exp(-(((temp - 0.7) / sigma) ** 2))
}

/**
 * Effective independent attempts out of k: at T→0 every sample is the same
 * attempt (k_eff→1); diversity buys independence back as T rises.
 */
export const effectiveK = (temp: number, k: number) => 1 + (k - 1) * Math.min(1, temp / 1.6)

export const passAtK = (temp: number, k: number) =>
  1 - (1 - successRate(temp)) ** effectiveK(temp, k)

/* ── §4 · speculative decoding ─────────────────────────────────── */

/**
 * Leviathan et al. (2211.17192): expected tokens produced per target-model
 * pass when a draft proposes γ tokens accepted i.i.d. with probability α.
 */
export const expectedTokens = (alpha: number, gamma: number) =>
  alpha === 1 ? gamma + 1 : (1 - alpha ** (gamma + 1)) / (1 - alpha)

/** KV-cache bytes per token: K and V, per layer, at bf16 (2 bytes). */
export const KV_CONFIG = { layers: 16, dModel: 2048, label: 'a 1B-class model (16 layers, d=2048)' }

export const kvBytesPerToken = 2 * KV_CONFIG.layers * KV_CONFIG.dModel * 2

export const fmtPct = (p: number, digits = 1) => `${(p * 100).toFixed(digits)}%`

export const fmtGb = (bytes: number) => `${(bytes / 1024 ** 3).toFixed(1)} GB`
