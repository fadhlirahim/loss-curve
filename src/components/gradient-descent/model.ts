/**
 * Two toy landscapes, chosen so the failure modes are exact, not anecdotal:
 *
 * §1 the bowl — L(w) = w². One dial. Each step multiplies the distance to
 *    the bottom by (1 − 2η), so the learning-rate regimes have sharp edges:
 *    η < 0.5 glides, η = 0.5 solves it in ONE step, 0.5 < η < 1 overshoots
 *    but converges, η = 1 bounces forever, η > 1 explodes.
 *
 * §2 the ravine — L(x, y) = ½(x² + κy²) with κ = 40. The simplest
 *    ill-conditioned loss: steep across, shallow along. SGD's stability is
 *    set by the steep wall (η < 2/κ = 0.05) while its speed is set by the
 *    shallow floor — so it must crawl or explode. Momentum tolerates
 *    η < 2(1+β)/κ = 0.095 and Adam ignores the conditioning entirely;
 *    that asymmetry is the whole reason these optimizers exist.
 */

export const fmt = (n: number) => (Object.is(n, -0) ? '0.00' : n.toFixed(2))

// ── §1 the bowl ──────────────────────────────────────────────────

export const W0 = 2.5
export const BOWL_MAX_STEPS = 120
const BOWL_BLOWUP = 50
const BOWL_FLOOR = 1e-5

export const bowlLoss = (w: number) => w * w
export const bowlGrad = (w: number) => 2 * w

export function descendBowl(history: number[], lr: number): number[] {
  if (bowlDone(history)) return history
  const w = history[history.length - 1]
  return [...history, w - lr * bowlGrad(w)]
}

export function bowlDone(history: number[]): boolean {
  const w = history[history.length - 1]
  return history.length > BOWL_MAX_STEPS || Math.abs(w) > BOWL_BLOWUP || bowlLoss(w) < BOWL_FLOOR
}

export type BowlVerdict = { label: string; tone: 'ok' | 'warn' | 'bad' }

/** The exact regimes for L = w²: each step scales w by (1 − 2η). */
export function bowlVerdict(lr: number, history: number[]): BowlVerdict {
  const w = history[history.length - 1]
  if (bowlLoss(w) < BOWL_FLOOR)
    return { label: `reached the bottom in ${history.length - 1} steps ✓`, tone: 'ok' }
  if (Math.abs(w) > BOWL_BLOWUP) return { label: 'diverged — the loss exploded', tone: 'bad' }
  const factor = 1 - 2 * lr
  if (Math.abs(Math.abs(factor) - 1) < 0.005)
    return { label: 'the edge of stability — bouncing forever', tone: 'warn' }
  if (Math.abs(factor) > 1) return { label: 'too big — every step makes it worse', tone: 'bad' }
  if (lr <= 0.03) return { label: 'converging, but crawling', tone: 'warn' }
  if (factor < 0) return { label: 'overshooting each step, still converging', tone: 'warn' }
  return { label: 'gliding down', tone: 'ok' }
}

// ── §2 the ravine ────────────────────────────────────────────────

export type Vec = { x: number; y: number }

export const KAPPA = 40
export const RAVINE_START: Vec = { x: -2.6, y: 1.25 }
export const RACE_MAX_STEPS = 120
const RACE_FLOOR = 1e-3
const RACE_BLOWUP = 1e4

export const ravineLoss = (p: Vec) => 0.5 * (p.x * p.x + KAPPA * p.y * p.y)
const ravineGrad = (p: Vec): Vec => ({ x: p.x, y: KAPPA * p.y })

export type RaceState = {
  sgd: Vec[]
  momentum: { path: Vec[]; v: Vec }
  adam: { path: Vec[]; m: Vec; v: Vec; t: number }
}

export function initRace(): RaceState {
  return {
    sgd: [RAVINE_START],
    momentum: { path: [RAVINE_START], v: { x: 0, y: 0 } },
    adam: { path: [RAVINE_START], m: { x: 0, y: 0 }, v: { x: 0, y: 0 }, t: 0 },
  }
}

const last = (path: Vec[]) => path[path.length - 1]
const settled = (path: Vec[]) => {
  const loss = ravineLoss(last(path))
  return path.length > RACE_MAX_STEPS || loss < RACE_FLOOR || loss > RACE_BLOWUP
}

export function advanceRace(s: RaceState, lr: number): RaceState {
  const next: RaceState = {
    sgd: s.sgd,
    momentum: { ...s.momentum },
    adam: { ...s.adam },
  }

  if (!settled(s.sgd)) {
    const p = last(s.sgd)
    const g = ravineGrad(p)
    next.sgd = [...s.sgd, { x: p.x - lr * g.x, y: p.y - lr * g.y }]
  }

  if (!settled(s.momentum.path)) {
    const beta = 0.9
    const p = last(s.momentum.path)
    const g = ravineGrad(p)
    const v = { x: beta * s.momentum.v.x + g.x, y: beta * s.momentum.v.y + g.y }
    next.momentum = { path: [...s.momentum.path, { x: p.x - lr * v.x, y: p.y - lr * v.y }], v }
  }

  if (!settled(s.adam.path)) {
    const b1 = 0.9
    const b2 = 0.999
    const eps = 1e-8
    const p = last(s.adam.path)
    const g = ravineGrad(p)
    const t = s.adam.t + 1
    const m = { x: b1 * s.adam.m.x + (1 - b1) * g.x, y: b1 * s.adam.m.y + (1 - b1) * g.y }
    const v = {
      x: b2 * s.adam.v.x + (1 - b2) * g.x * g.x,
      y: b2 * s.adam.v.y + (1 - b2) * g.y * g.y,
    }
    const mh = { x: m.x / (1 - b1 ** t), y: m.y / (1 - b1 ** t) }
    const vh = { x: v.x / (1 - b2 ** t), y: v.y / (1 - b2 ** t) }
    next.adam = {
      path: [
        ...s.adam.path,
        {
          x: p.x - (lr * mh.x) / (Math.sqrt(vh.x) + eps),
          y: p.y - (lr * mh.y) / (Math.sqrt(vh.y) + eps),
        },
      ],
      m,
      v,
      t,
    }
  }

  return next
}

export function raceDone(s: RaceState): boolean {
  return settled(s.sgd) && settled(s.momentum.path) && settled(s.adam.path)
}

export type RacerId = 'sgd' | 'momentum' | 'adam'

/** `recipe` is KaTeX source — each optimizer's update rule. */
export const RACERS: { id: RacerId; name: string; color: string; recipe: string }[] = [
  {
    id: 'sgd',
    name: 'SGD',
    color: 'var(--color-ink-soft)',
    recipe: 'w \\leftarrow w - \\eta \\, g',
  },
  {
    id: 'momentum',
    name: 'momentum',
    color: 'var(--color-gold)',
    recipe: 'v \\leftarrow \\beta v + g \\qquad w \\leftarrow w - \\eta \\, v',
  },
  {
    id: 'adam',
    name: 'Adam',
    color: 'var(--color-vermillion)',
    recipe: 'w \\leftarrow w - \\eta \\, \\hat{m} \\,/\\, (\\sqrt{\\hat{v}} + \\varepsilon)',
  },
]

export function racePath(s: RaceState, id: RacerId): Vec[] {
  if (id === 'sgd') return s.sgd
  if (id === 'momentum') return s.momentum.path
  return s.adam.path
}

/** "settled in N steps", "diverged", or current loss, for the legend. */
export function raceStatus(path: Vec[]): string {
  const loss = ravineLoss(last(path))
  if (loss < RACE_FLOOR) return `settled in ${path.length - 1} steps ✓`
  if (loss > RACE_BLOWUP) return `diverged after ${path.length - 1} steps ✗`
  if (path.length > RACE_MAX_STEPS)
    return `still at loss ${fmt(loss)} after ${RACE_MAX_STEPS} steps`
  return `loss ${fmt(loss)}`
}
