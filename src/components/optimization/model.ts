/**
 * Three exact demonstrations of what changes at scale:
 *
 * §1 noisy descent — the same ravine as Phase 1's optimizer lab, but the
 *    gradient is an ESTIMATE: g = ∇L + (σ/√B)·ξ with seeded Gaussian ξ.
 *    One seed, every batch size — only the noise scale changes, so the
 *    trajectories are directly comparable.
 *
 * §2 the critical batch size — McCandlish et al.'s tradeoff shape:
 *    steps to target S(B) = S_min(1 + B_crit/B), examples E(B) = B·S(B).
 *    At B = B_crit both are exactly 2× their minima — the knee.
 *
 * §3 gradient accumulation — one batch-32 step vs 4 accumulated micro-
 *    batches of 8 on a seeded linear regression: identical updates to
 *    floating-point dust, with a quarter of the activation memory.
 */

import { seededRng } from '@/components/neural-net/model'

export type Vec = { x: number; y: number }

export const fmt2 = (n: number) => n.toFixed(2)

// ── §1 the noisy ravine ──────────────────────────────────────────

export const KAPPA = 6
export const NOISY_LR = 0.12
export const NOISE_SCALE = 3
export const NOISY_START: Vec = { x: -2.6, y: 1.25 }
export const TRAJ_STEPS = 160

export const noisyLoss = (p: Vec) => 0.5 * (p.x * p.x + KAPPA * p.y * p.y)
const noisyGrad = (p: Vec): Vec => ({ x: p.x, y: KAPPA * p.y })

/** Per-coordinate std of the gradient noise at batch size B. */
export const noiseStd = (batch: number) => NOISE_SCALE / Math.sqrt(batch)

/** Signal-to-noise of the gradient estimate at the starting point. */
export function snrAtStart(batch: number): number {
  const g = noisyGrad(NOISY_START)
  return Math.hypot(g.x, g.y) / noiseStd(batch)
}

const gaussPair = (rng: () => number): Vec => {
  const r = Math.sqrt(-2 * Math.log(1 - rng()))
  const theta = 2 * Math.PI * rng()
  return { x: r * Math.cos(theta), y: r * Math.sin(theta) }
}

/**
 * The whole trajectory, precomputed and deterministic: one fixed seed, so
 * changing B rescales the SAME noise draws instead of rolling new ones.
 */
export function noisyTrajectory(batch: number, steps = TRAJ_STEPS): Vec[] {
  const rng = seededRng(1337)
  const s = noiseStd(batch)
  let p = NOISY_START
  const path = [p]
  for (let t = 0; t < steps; t++) {
    const g = noisyGrad(p)
    const xi = gaussPair(rng)
    p = { x: p.x - NOISY_LR * (g.x + s * xi.x), y: p.y - NOISY_LR * (g.y + s * xi.y) }
    path.push(p)
  }
  return path
}

/** Where the run settles: mean loss over the trajectory's last quarter. */
export function noiseBallLoss(path: Vec[]): number {
  const tail = path.slice(-Math.ceil(path.length / 4))
  return tail.reduce((sum, p) => sum + noisyLoss(p), 0) / tail.length
}

export type Verdict = { label: string; tone: 'ok' | 'warn' | 'bad' }

export function noisyVerdict(batch: number): Verdict {
  const snr = snrAtStart(batch)
  if (snr < 4) return { label: 'a drunken walk — the estimate is mostly noise', tone: 'bad' }
  if (snr < 15) return { label: 'descending, but wobbling in the noise', tone: 'warn' }
  return { label: 'smooth — more samples now buy very little', tone: 'ok' }
}

// ── §2 the critical batch size ───────────────────────────────────

export const S_MIN = 1000

/** Optimization steps to reach the target at batch size B. */
export const stepsToTarget = (batch: number, bCrit: number) => S_MIN * (1 + bCrit / batch)

/** Examples consumed to reach the target: E(B) = B · S(B). */
export const examplesToTarget = (batch: number, bCrit: number) =>
  batch * stepsToTarget(batch, bCrit)

export function batchVerdict(batch: number, bCrit: number): Verdict {
  if (batch < bCrit / 2)
    return { label: 'below the knee — doubling B is a nearly free speedup', tone: 'ok' }
  if (batch > bCrit * 2)
    return { label: 'past the knee — burning tokens to save wall-clock', tone: 'bad' }
  return { label: 'near the knee — the efficient frontier', tone: 'warn' }
}

// ── §3 gradient accumulation ─────────────────────────────────────

export const N_EXAMPLES = 32
export const MICRO_BATCH = 8
export const ACCUM_STEPS = 30
export const ACCUM_LR = 0.3
export const ACCUM_START: Vec = { x: -1.5, y: 1.2 } // (w, b)

/** Seeded 1-D regression set: y = 2x − 1 + noise. */
const makeData = () => {
  const rng = seededRng(7)
  return Array.from({ length: N_EXAMPLES }, (_, i) => {
    const x = -1 + (2 * i) / (N_EXAMPLES - 1)
    return { x, y: 2 * x - 1 + 0.3 * gaussPair(rng).x }
  })
}

export const DATA = makeData()

export const mseLoss = (p: Vec) =>
  DATA.reduce((sum, d) => sum + (p.x * d.x + p.y - d.y) ** 2, 0) / N_EXAMPLES

/** Least-squares optimum — the contour center (x̄ = 0 by construction). */
export function lsqOptimum(): Vec {
  const sxx = DATA.reduce((s, d) => s + d.x * d.x, 0)
  const sxy = DATA.reduce((s, d) => s + d.x * d.y, 0)
  const sy = DATA.reduce((s, d) => s + d.y, 0)
  return { x: sxy / sxx, y: sy / N_EXAMPLES }
}

/** Mean of x² over the data — the w-curvature of the MSE bowl. */
export const XX_MEAN = DATA.reduce((s, d) => s + d.x * d.x, 0) / N_EXAMPLES

const exampleGrad = (p: Vec, d: { x: number; y: number }): Vec => {
  const err = 2 * (p.x * d.x + p.y - d.y)
  return { x: err * d.x, y: err }
}

/** One step from the full batch of 32, summed in index order. */
function fullBatchStep(p: Vec): Vec {
  let gx = 0
  let gy = 0
  for (const d of DATA) {
    const g = exampleGrad(p, d)
    gx += g.x
    gy += g.y
  }
  return { x: p.x - (ACCUM_LR * gx) / N_EXAMPLES, y: p.y - (ACCUM_LR * gy) / N_EXAMPLES }
}

/** The same step as 4 accumulated micro-batches of 8 — summed, then applied once. */
function accumulatedStep(p: Vec): Vec {
  let gx = 0
  let gy = 0
  for (let m = 0; m < N_EXAMPLES / MICRO_BATCH; m++) {
    let mx = 0
    let my = 0
    for (const d of DATA.slice(m * MICRO_BATCH, (m + 1) * MICRO_BATCH)) {
      const g = exampleGrad(p, d)
      mx += g.x
      my += g.y
    }
    gx += mx
    gy += my
  }
  return { x: p.x - (ACCUM_LR * gx) / N_EXAMPLES, y: p.y - (ACCUM_LR * gy) / N_EXAMPLES }
}

export type AccumRun = { full: Vec[]; accum: Vec[]; maxDivergence: number }

/** Both trajectories, plus the largest coordinate gap anywhere along them. */
export function runAccumulation(steps = ACCUM_STEPS): AccumRun {
  const full = [ACCUM_START]
  const accum = [ACCUM_START]
  let maxDivergence = 0
  for (let t = 0; t < steps; t++) {
    full.push(fullBatchStep(full[full.length - 1]))
    accum.push(accumulatedStep(accum[accum.length - 1]))
    const f = full[full.length - 1]
    const a = accum[accum.length - 1]
    maxDivergence = Math.max(maxDivergence, Math.abs(f.x - a.x), Math.abs(f.y - a.y))
  }
  return { full, accum, maxDivergence }
}
