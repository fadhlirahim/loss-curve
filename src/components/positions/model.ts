/**
 * The math behind /learn/positions.
 *
 * §1 reuses the attention lab's sentence and scores to show permutation
 * blindness. §2 hand-crafts a learned absolute position table (with the
 * untrained tail that makes extrapolation fail). §3 is real RoPE-in-2D:
 * genuine rotations, so the "dot product depends only on the offset"
 * property is computed, not asserted.
 */

import { RAW } from '@/components/attention/model'

/** Fixed permutations of the 9-token sentence — deterministic, SSR-safe. */
export const PERMUTATIONS = [
  { label: 'original', order: [0, 1, 2, 3, 4, 5, 6, 7, 8] },
  { label: 'bird ↔ worm', order: [0, 4, 2, 3, 1, 5, 6, 7, 8] },
  { label: 'reversed', order: [8, 7, 6, 5, 4, 3, 2, 1, 0] },
  { label: 'scrambled', order: [2, 0, 8, 1, 6, 3, 7, 4, 5] },
]

/** Score matrix for a permuted sentence: same values, relocated with their tokens. */
export const permutedScores = (order: number[]) => order.map((qi) => order.map((kj) => RAW[qi][kj]))

/** Where the (qToken, kToken) cell lands after permuting: [row, col]. */
export const cellAfterPermute = (order: number[], qToken: number, kToken: number) =>
  [order.indexOf(qToken), order.indexOf(kToken)] as const

/* ── §2 · learned absolute positions ─────────────────────────── */

export const POS_DIMS = ['first?', 'early?', 'middle?', 'late?']

/** Hand-crafted "trained" position vectors for slots 0–8. */
export const POS_EMB = [
  [1.0, 1.0, 0.0, 0.0],
  [0.0, 0.9, 0.1, 0.0],
  [0.0, 0.7, 0.3, 0.0],
  [0.0, 0.5, 0.6, 0.0],
  [0.0, 0.3, 1.0, 0.1],
  [0.0, 0.2, 0.8, 0.3],
  [0.0, 0.1, 0.5, 0.6],
  [0.0, 0.0, 0.2, 0.9],
  [0.0, 0.0, 0.1, 1.1],
]

export const TRAINED_POSITIONS = POS_EMB.length

export const MAX_POSITION = 15

/** A sample token's content on the same four channels position gets added to. */
export const SAMPLE_TOKEN = { label: 'bird', vec: [0.9, 0.2, 0.4, 0.3] }

/** Deterministic stand-in for what random init leaves in never-trained slots. */
export const untrainedNoise = (p: number, d: number) => Math.sin((p + 1) * (d + 2) * 3.7) * 0.45

/* ── §3 · RoPE — rotate the pair ─────────────────────────────── */

/** Radians per position step for the demo's (fast) band. */
export const THETA = 0.35

export const ROPE_MAX_POS = 20

/** The un-rotated 2-d query and key this head starts from. */
export const Q0: [number, number] = [0.9, 0.35]
export const K0: [number, number] = [0.7, 0.55]

export const rotate = (v: readonly [number, number], angle: number): [number, number] => {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  return [v[0] * cos - v[1] * sin, v[0] * sin + v[1] * cos]
}

export const ropeQ = (i: number) => rotate(Q0, i * THETA)
export const ropeK = (j: number) => rotate(K0, j * THETA)

const dot2 = (a: readonly [number, number], b: readonly [number, number]) =>
  a[0] * b[0] + a[1] * b[1]

/** The number the lab keeps re-deriving: q·k after both rotations. */
export const ropeDot = (i: number, j: number) => dot2(ropeQ(i), ropeK(j))

/** q·k as a function of offset alone — what makes RoPE relative. */
export const dotAtOffset = (offset: number) => ropeDot(offset, 0)

/** Three rotation speeds: clock hands for local order vs long range. */
export const BANDS = [
  { label: 'fast · θ', theta: THETA, sense: 'local order — wraps quickly' },
  { label: 'slower · θ/4', theta: THETA / 4, sense: 'mid-range structure' },
  { label: 'slowest · θ/16', theta: THETA / 16, sense: 'long-range position sense' },
]
