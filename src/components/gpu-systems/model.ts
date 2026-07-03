/**
 * Where the time and the memory go, in checkable arithmetic.
 *
 * Hardware constants are H100 SXM stated specs (dense bf16, HBM3). The
 * transformer shape is derived from a parameter count with the standard
 * aspect-ratio heuristic (N ≈ 12·L·d², d ≈ 128·L), and activation memory
 * uses Megatron's no-recomputation estimate — approximations, but the
 * published ones, and they land within a few percent of real configs.
 */

export const PEAK_FLOPS = 989e12
export const HBM_BW = 3.35e12
export const RIDGE = PEAK_FLOPS / HBM_BW // ≈ 295 FLOP/byte

export const INFER_PRECISIONS = [
  { id: 'fp32', label: 'fp32', bytesPerParam: 4 },
  { id: 'bf16', label: 'bf16', bytesPerParam: 2 },
  { id: 'int8', label: 'int8', bytesPerParam: 1 },
  { id: 'int4', label: 'int4', bytesPerParam: 0.5 },
]

/** AdamW mixed-precision training: 16 bytes riding on every parameter. */
const TRAIN_STATES = [
  { key: 'weights · bf16', bytesPerParam: 2 },
  { key: 'gradients · bf16', bytesPerParam: 2 },
  { key: 'master weights · fp32', bytesPerParam: 4 },
  { key: 'Adam momentum · fp32', bytesPerParam: 4 },
  { key: 'Adam variance · fp32', bytesPerParam: 4 },
]

export const TRAIN_BYTES_PER_PARAM = TRAIN_STATES.reduce((s, p) => s + p.bytesPerParam, 0)

export const GPUS = [
  { name: 'RTX 4090', gb: 24 },
  { name: 'A100 / H100 80GB', gb: 80 },
]

/** Standard aspect-ratio heuristic: N ≈ 12·L·d² with d/L ≈ 128. */
export const configFromParams = (n: number) => {
  const dRaw = Math.cbrt((n * 128) / 12)
  const d = Math.max(256, Math.round(dRaw / 128) * 128)
  const layers = Math.max(4, Math.round(d / 128))
  return { d, layers, heads: d / 128 }
}

/** Megatron no-recomputation estimate, bytes per layer at bf16. */
const activationBytes = (n: number, batch: number, seq: number) => {
  const { d, layers, heads } = configFromParams(n)
  return layers * seq * batch * d * (34 + (5 * heads * seq) / d)
}

export const trainMemory = (n: number, batch: number, seq: number) => {
  const segments = TRAIN_STATES.map((s) => ({ key: s.key, bytes: s.bytesPerParam * n }))
  segments.push({ key: 'activations (no recompute)', bytes: activationBytes(n, batch, seq) })
  return { segments, total: segments.reduce((s, x) => s + x.bytes, 0) }
}

export const inferMemory = (n: number, bytesPerParam: number) => n * bytesPerParam

/** ── roofline ─────────────────────────────────────────────────── */

type Op = { flops: number; bytes: number }

export const matmulOp = (m: number, n: number, k: number): Op => ({
  flops: 2 * m * n * k,
  bytes: 2 * (m * k + k * n + m * n),
})

export const elementwiseOp = (len: number): Op => ({ flops: len, bytes: 3 * 2 * len })

/** QKᵀ for one head at head-dim 128: a (T×128)·(128×T) matmul. */
export const attentionScoresOp = (seq: number): Op => matmulOp(seq, seq, 128)

export const intensity = (op: Op) => op.flops / op.bytes

/** What the GPU can actually deliver at a given arithmetic intensity. */
export const achievedFlops = (i: number) => Math.min(PEAK_FLOPS, i * HBM_BW)

/** ── FlashAttention memory ────────────────────────────────────── */

/** Naive attention materializes the T×T score matrix (bf16, one head). */
export const naiveScoreBytes = (seq: number) => 2 * seq * seq

/** Flash keeps O(T) running statistics instead (row max + row sum + output tile). */
export const flashScoreBytes = (seq: number) => 2 * seq * (128 + 2)

/** ── parallelism map ──────────────────────────────────────────── */

export const PARALLELISMS = [
  {
    name: 'data parallel',
    replicated: 'the whole model, on every GPU',
    sharded: 'the batch — each GPU sees different examples',
    communicated: 'gradients, all-reduced once per step',
    reachFor:
      'the default. Cheap to reason about, scales until the model itself no longer fits on one device.',
  },
  {
    name: 'tensor parallel',
    replicated: 'the schedule — every GPU works on every layer',
    sharded: 'the matmuls themselves, split across devices',
    communicated: 'activations, all-reduced inside every layer',
    reachFor:
      'when one layer is too big or too slow. Needs NVLink-class interconnect — the chatter is constant.',
  },
  {
    name: 'pipeline parallel',
    replicated: 'nothing — each GPU owns a contiguous slice of layers',
    sharded: 'the depth of the network',
    communicated: 'activations at stage boundaries, micro-batch by micro-batch',
    reachFor:
      'very deep models across slower links. The price is bubbles — idle time while stages wait.',
  },
]

/** ── formatting ───────────────────────────────────────────────── */

export const fmtParams = (n: number) =>
  n >= 1e9 ? `${(n / 1e9).toFixed(1)}B` : `${Math.round(n / 1e6)}M`

export const fmtBytes = (b: number) => {
  if (b >= 1e12) return `${(b / 1e12).toFixed(1)} TB`
  if (b >= 1e9) return `${(b / 1e9).toFixed(1)} GB`
  return `${(b / 1e6).toFixed(0)} MB`
}

export const fmtFlops = (f: number) =>
  f >= 1e12 ? `${(f / 1e12).toFixed(0)} TFLOP/s` : `${(f / 1e9).toFixed(0)} GFLOP/s`

export const fmtIntensity = (i: number) =>
  i >= 100 ? i.toFixed(0) : i >= 1 ? i.toFixed(1) : i.toFixed(2)
