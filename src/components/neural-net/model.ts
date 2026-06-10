/**
 * A real MLP, trained for real, in the browser: 2 inputs → hidden layers →
 * 1 sigmoid output, full-batch gradient descent on binary cross-entropy.
 * Everything is seeded (mulberry32) so SSR and client render identically
 * and "re-roll the dice" is an honest, reproducible experiment.
 *
 * The three datasets are chosen to make the architecture argument:
 *   blobs  — linearly separable; even the linear model wins.
 *   rings  — one class inside the other; a line CANNOT solve it, one
 *            hidden layer can. This is why activations exist.
 *   spiral — interleaved arms; needs width + depth and patience. This is
 *            why "features of features" help.
 */

export type Activation = 'tanh' | 'relu'
export type DatasetKind = 'blobs' | 'rings' | 'spiral'
export type InitKind = 'random' | 'zeros'

export type Point = { x: number; y: number; label: 0 | 1 }

export type Net = {
  /** layer sizes incl. input and output, e.g. [2, 8, 8, 1] */
  sizes: number[]
  /** W[l] is (out × in) for layer l; b[l] is (out) */
  W: number[][][]
  b: number[][]
}

export const fmt = (n: number) => (Object.is(n, -0) ? '0.00' : n.toFixed(2))

// ── seeded randomness (SSR-safe, reproducible re-rolls) ─────────

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function gaussian(rng: () => number) {
  return Math.sqrt(-2 * Math.log(rng() + 1e-12)) * Math.cos(2 * Math.PI * rng())
}

// ── datasets ─────────────────────────────────────────────────────

export function makeDataset(kind: DatasetKind, seed: number): Point[] {
  const rng = mulberry32(seed * 7919 + 17)
  const pts: Point[] = []

  if (kind === 'blobs') {
    for (let i = 0; i < 70; i++) {
      pts.push({ x: -0.5 + 0.26 * gaussian(rng), y: -0.4 + 0.26 * gaussian(rng), label: 0 })
      pts.push({ x: 0.5 + 0.26 * gaussian(rng), y: 0.45 + 0.26 * gaussian(rng), label: 1 })
    }
  } else if (kind === 'rings') {
    for (let i = 0; i < 80; i++) {
      const t0 = rng() * 2 * Math.PI
      const r0 = 0.38 * Math.sqrt(rng())
      pts.push({ x: r0 * Math.cos(t0), y: r0 * Math.sin(t0), label: 0 })
      const t1 = rng() * 2 * Math.PI
      const r1 = 0.62 + 0.3 * rng()
      pts.push({ x: r1 * Math.cos(t1), y: r1 * Math.sin(t1), label: 1 })
    }
  } else {
    for (let i = 0; i < 90; i++) {
      const t = (i / 90) * 2.5 * Math.PI
      const r = 0.08 + (0.85 * i) / 90
      for (const label of [0, 1] as const) {
        const phase = t + label * Math.PI
        pts.push({
          x: r * Math.sin(phase) + 0.04 * gaussian(rng),
          y: r * Math.cos(phase) + 0.04 * gaussian(rng),
          label,
        })
      }
    }
  }
  return pts
}

// ── the network ──────────────────────────────────────────────────

export function initNet(hidden: readonly number[], init: InitKind, seed: number): Net {
  const sizes = [2, ...hidden, 1]
  const rng = mulberry32(seed * 104729 + 31)
  const W: number[][][] = []
  const b: number[][] = []
  for (let l = 1; l < sizes.length; l++) {
    const fanIn = sizes[l - 1]
    const scale = init === 'zeros' ? 0 : Math.sqrt(1 / fanIn)
    W.push(
      Array.from({ length: sizes[l] }, () =>
        Array.from({ length: fanIn }, () => scale * gaussian(rng)),
      ),
    )
    b.push(Array.from({ length: sizes[l] }, () => 0))
  }
  return { sizes, W, b }
}

export function paramCount(net: Net): number {
  let n = 0
  for (let l = 0; l < net.W.length; l++) n += net.W[l].length * net.W[l][0].length + net.b[l].length
  return n
}

const act = (z: number, a: Activation) => (a === 'tanh' ? Math.tanh(z) : Math.max(0, z))
const actPrime = (z: number, a: Activation) =>
  a === 'tanh' ? 1 - Math.tanh(z) ** 2 : z > 0 ? 1 : 0
const sigmoid = (z: number) => 1 / (1 + Math.exp(-z))

/** Forward pass; returns activations and pre-activations per layer. */
function forward(net: Net, x: number, y: number, activation: Activation) {
  const as: number[][] = [[x, y]]
  const zs: number[][] = []
  for (let l = 0; l < net.W.length; l++) {
    const lastLayer = l === net.W.length - 1
    const z = net.W[l].map((row, i) => row.reduce((s, w, j) => s + w * as[l][j], net.b[l][i]))
    zs.push(z)
    as.push(z.map((v) => (lastLayer ? sigmoid(v) : act(v, activation))))
  }
  return { as, zs }
}

export function predict(net: Net, x: number, y: number, activation: Activation): number {
  const { as } = forward(net, x, y, activation)
  return as[as.length - 1][0]
}

/** Backprop one sample, accumulating into dW/db; returns its BCE loss. */
function backpropSample(
  net: Net,
  p: Point,
  activation: Activation,
  dW: number[][][],
  db: number[][],
): number {
  const { as, zs } = forward(net, p.x, p.y, activation)
  const out = as[as.length - 1][0]

  // δ for the sigmoid+BCE output layer is simply (p − y)
  let delta = [out - p.label]
  for (let l = net.W.length - 1; l >= 0; l--) {
    for (let i = 0; i < delta.length; i++) {
      db[l][i] += delta[i]
      for (let j = 0; j < as[l].length; j++) dW[l][i][j] += delta[i] * as[l][j]
    }
    if (l > 0)
      delta = as[l].map((_, j) => {
        let s = 0
        for (let i = 0; i < delta.length; i++) s += net.W[l][i][j] * delta[i]
        return s * actPrime(zs[l - 1][j], activation)
      })
  }
  return -(p.label * Math.log(out + 1e-9) + (1 - p.label) * Math.log(1 - out + 1e-9))
}

/**
 * One full-batch gradient-descent epoch (forward + backprop over every
 * point, then a single weight update). Returns the mean BCE loss.
 */
function epoch(net: Net, data: Point[], lr: number, activation: Activation): number {
  const dW = net.W.map((m) => m.map((row) => row.map(() => 0)))
  const db = net.b.map((v) => v.map(() => 0))
  let loss = 0
  for (const p of data) loss += backpropSample(net, p, activation, dW, db)

  const n = data.length
  for (let l = 0; l < net.W.length; l++) {
    for (let i = 0; i < net.W[l].length; i++) {
      net.b[l][i] -= (lr * db[l][i]) / n
      for (let j = 0; j < net.W[l][i].length; j++) net.W[l][i][j] -= (lr * dW[l][i][j]) / n
    }
  }
  return loss / n
}

/** Train `epochs` epochs on a structural copy; returns new net + final loss. */
export function trainEpochs(
  net: Net,
  data: Point[],
  lr: number,
  activation: Activation,
  epochs: number,
): { net: Net; loss: number } {
  const copy: Net = {
    sizes: net.sizes,
    W: net.W.map((m) => m.map((row) => [...row])),
    b: net.b.map((v) => [...v]),
  }
  let loss = 0
  for (let e = 0; e < epochs; e++) loss = epoch(copy, data, lr, activation)
  return { net: copy, loss }
}

export function accuracy(net: Net, data: Point[], activation: Activation): number {
  let hit = 0
  for (const p of data) if ((predict(net, p.x, p.y, activation) > 0.5 ? 1 : 0) === p.label) hit++
  return hit / data.length
}

/** Class probabilities over an res×res grid spanning [-1.1, 1.1]² — the boundary heatmap. */
export function predictGrid(net: Net, activation: Activation, res: number): number[] {
  const out: number[] = []
  for (let gy = 0; gy < res; gy++) {
    for (let gx = 0; gx < res; gx++) {
      const x = -1.1 + (2.2 * (gx + 0.5)) / res
      const y = 1.1 - (2.2 * (gy + 0.5)) / res
      out.push(predict(net, x, y, activation))
    }
  }
  return out
}

// ── presets ──────────────────────────────────────────────────────

export const ARCHITECTURES = [
  { id: 'linear', label: 'no hidden layer', hidden: [] as number[] },
  { id: 'shallow', label: '1 hidden × 8', hidden: [8] },
  { id: 'deep', label: '2 hidden × 8', hidden: [8, 8] },
] as const

export type ArchId = (typeof ARCHITECTURES)[number]['id']

export const DATASETS: { id: DatasetKind; label: string; hint: string }[] = [
  { id: 'blobs', label: 'blobs', hint: 'a line suffices' },
  { id: 'rings', label: 'rings', hint: 'a line cannot win' },
  { id: 'spiral', label: 'spiral', hint: 'needs depth + patience' },
]

export const MAX_EPOCHS = 6000
export const EPOCHS_PER_TICK = 40
