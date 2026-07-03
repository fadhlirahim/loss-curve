/**
 * The Chinchilla parametric scaling law, live.
 *
 * L(N, D) = E + A/N^α + B/D^β — loss as a function of parameter count N and
 * training tokens D. Constants are the Epoch AI replication's re-fit of
 * Chinchilla's approach-3 estimate (Besiroglu et al. 2024), which repairs the
 * paper's own Table A3 numbers so all three approaches agree on the famous
 * ~20 tokens/param ridge. Fitted on MassiveText — treat the shape as the
 * lesson, not the digits. Everything downstream (optima, costs, the
 * inference-aware bend) is computed numerically from this one formula.
 */

const E = 1.8172
const A = 482.01
const B = 2085.43
const ALPHA = 0.3478
const BETA = 0.3658

export const chinchillaLoss = (n: number, d: number) => E + A / n ** ALPHA + B / d ** BETA

/** The three additive pieces of the loss — who is holding you back. */
export const lossTerms = (n: number, d: number) => ({
  irreducible: E,
  params: A / n ** ALPHA,
  data: B / d ** BETA,
})

/** Training compute in FLOPs, the standard 6ND approximation. */
export const flopsFor = (n: number, d: number) => 6 * n * d

type Optimal = { n: number; d: number; loss: number; ratio: number }

/** Best N (and implied D = C/6N) for a fixed budget C — dense scan, no closed form. */
export const computeOptimal = (c: number): Optimal => {
  let best: Optimal | null = null
  for (let logN = 6; logN <= 12; logN += 0.005) {
    const n = 10 ** logN
    const d = c / (6 * n)
    const loss = chinchillaLoss(n, d)
    if (!best || loss < best.loss) best = { n, d, loss, ratio: d / n }
  }
  return best as Optimal
}

/** Loss along the iso-compute curve, centered on the optimum, for plotting. */
export const isoComputeCurve = (c: number, points = 120) => {
  const opt = computeOptimal(c)
  const lo = Math.log10(opt.n) - 2
  const hi = Math.log10(opt.n) + 1.5
  return Array.from({ length: points }, (_, i) => {
    const n = 10 ** (lo + ((hi - lo) * i) / (points - 1))
    return { n, loss: chinchillaLoss(n, c / (6 * n)) }
  })
}

/** How the current N/D split compares to the optimal ridge at the same budget. */
export const sizingVerdict = (n: number, d: number) => {
  const opt = computeOptimal(flopsFor(n, d))
  const factor = d / n / opt.ratio
  if (factor < 0.5) return 'under' as const
  if (factor > 2) return 'over' as const
  return 'ridge' as const
}

type InferenceOptimal = {
  n: number
  d: number
  train: number
  inference: number
  total: number
  ratio: number
}

/** Smallest model that can ever reach targetLoss (data term → 0). */
const minParamsForLoss = (targetLoss: number) => (A / (targetLoss - E)) ** (1 / ALPHA)

const tokensForLossAtN = (targetLoss: number, n: number) => {
  const dataBudget = targetLoss - E - A / n ** ALPHA
  return (B / dataBudget) ** (1 / BETA)
}

/**
 * Sardana–Frankle framing: hit a target loss while minimizing train FLOPs
 * (6ND) PLUS lifetime inference FLOPs (2N per token served). dInf = 0
 * recovers the pure Chinchilla optimum for that loss.
 */
export const inferenceAwareOptimal = (targetLoss: number, dInf: number): InferenceOptimal => {
  const nMin = minParamsForLoss(targetLoss)
  let best: InferenceOptimal | null = null
  for (let step = 0; step <= 400; step++) {
    const n = nMin * 10 ** (0.01 + (2.5 * step) / 400)
    const d = tokensForLossAtN(targetLoss, n)
    const train = 6 * n * d
    const inference = 2 * n * dInf
    const total = train + inference
    if (!best || total < best.total) best = { n, d, train, inference, total, ratio: d / n }
  }
  return best as InferenceOptimal
}

/** Total-FLOPs-vs-N curve at a target loss, for the §4 plot. */
export const inferenceCostCurve = (targetLoss: number, dInf: number, points = 120) => {
  const nMin = minParamsForLoss(targetLoss)
  return Array.from({ length: points }, (_, i) => {
    const n = nMin * 10 ** (0.02 + (2.5 * i) / (points - 1))
    const d = tokensForLossAtN(targetLoss, n)
    return { n, total: 6 * n * d + 2 * n * dInf }
  })
}

type Gpu = { id: string; label: string; flops: number; defaultRate: number; note: string }

/** Peak dense bf16 throughput — marketing sheets quote sparse/FP8, we don't. */
export const GPUS: Gpu[] = [
  { id: '4090', label: 'RTX 4090', flops: 165e12, defaultRate: 0.5, note: '165 TF dense bf16' },
  { id: 'a100', label: 'A100 80GB', flops: 312e12, defaultRate: 1.5, note: '312 TF dense bf16' },
  {
    id: 'h100x8',
    label: '8×H100 node',
    flops: 7.9e15,
    defaultRate: 24,
    note: '8 × 989 TF dense bf16',
  },
]

export const wallHours = (c: number, gpuFlops: number, mfu: number) => c / (gpuFlops * mfu) / 3600

type Preset = { id: string; label: string; n: number; d: number; story: string }

export const PRESETS: Preset[] = [
  {
    id: 'gpt2',
    label: 'GPT-2 124M · 10B tokens',
    n: 124e6,
    d: 10e9,
    story: 'The classic first reproduction — nanoGPT territory.',
  },
  {
    id: 'chin1b',
    label: 'Chinchilla-optimal 1B',
    n: 1e9,
    d: 20e9,
    story: 'A 1B model fed its ~20 tokens/param ration.',
  },
  {
    id: 'nanochat',
    label: 'nanochat speedrun',
    n: 560e6,
    d: 11.2e9,
    story: 'The "$100 ChatGPT" tier — a few hours on one rented node.',
  },
]

export const fmtLoss = (x: number) => x.toFixed(3)

export const fmtCount = (x: number) => {
  if (x >= 1e12) return `${(x / 1e12).toFixed(x >= 1e13 ? 0 : 1)}T`
  if (x >= 1e9) return `${(x / 1e9).toFixed(x >= 1e10 ? 0 : 1)}B`
  if (x >= 1e6) return `${(x / 1e6).toFixed(x >= 1e7 ? 0 : 1)}M`
  return `${Math.round(x / 1e3)}K`
}

export const fmtFlops = (x: number) => {
  const exp = Math.floor(Math.log10(x))
  return `${(x / 10 ** exp).toFixed(1)}e${exp}`
}

export const fmtHours = (h: number) => {
  if (h < 1) return `${Math.round(h * 60)} min`
  if (h < 100) return `${h.toFixed(1)} h`
  return `${Math.round(h).toLocaleString('en-US')} h (${(h / 24).toFixed(0)} d)`
}

export const fmtMoney = (x: number) =>
  x < 10 ? `$${x.toFixed(2)}` : `$${Math.round(x).toLocaleString('en-US')}`
