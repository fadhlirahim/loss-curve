import { evaluate, fmt, lossAt, type Params } from './model'

const W = 460
const H = 280
const PAD = { top: 18, right: 18, bottom: 34, left: 44 }

const A_MIN = -3
const A_MAX = 3
const SAMPLES = 96

/**
 * L plotted against the single input `a`, everything else frozen.
 * The vermillion tangent's slope IS ∂L/∂a — the number backprop computed.
 * The nudge shows prediction (tangent) vs reality (curve) drifting apart
 * as ε grows: a gradient is only a local promise.
 */
export function SlopePlot({ params, epsilon }: { params: Params; epsilon: number }) {
  const { values, grads } = evaluate(params)
  const ga = grads.a

  // y-range: L is bounded by ±|f| (tanh ∈ [−1, 1]), pad a little
  const yMax = Math.max(Math.abs(params.f), 0.5) * 1.15
  const x = (a: number) => PAD.left + ((a - A_MIN) / (A_MAX - A_MIN)) * (W - PAD.left - PAD.right)
  const y = (l: number) => PAD.top + ((yMax - l) / (2 * yMax)) * (H - PAD.top - PAD.bottom)

  const curve = Array.from({ length: SAMPLES + 1 }, (_, i) => {
    const a = A_MIN + (i / SAMPLES) * (A_MAX - A_MIN)
    return `${i === 0 ? 'M' : 'L'}${x(a).toFixed(1)},${y(lossAt(a, params)).toFixed(1)}`
  }).join(' ')

  const a0 = params.a
  const L0 = values.L
  const aN = Math.min(A_MAX, Math.max(A_MIN, a0 + epsilon))
  const actual = lossAt(aN, params)
  const predicted = L0 + ga * (aN - a0)

  // tangent segment, clipped to the visible a-range
  const t0 = Math.max(A_MIN, a0 - 1.4)
  const t1 = Math.min(A_MAX, a0 + 1.4)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Loss as a function of input a. Slope at a is ${fmt(ga)}.`}
    >
      <title>The gradient is a slope</title>
      {/* axes */}
      <line x1={PAD.left} x2={W - PAD.right} y1={y(0)} y2={y(0)} stroke="var(--color-paper-edge)" />
      <line
        x1={PAD.left}
        x2={PAD.left}
        y1={PAD.top}
        y2={H - PAD.bottom}
        stroke="var(--color-ink-faint)"
      />
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        stroke="var(--color-ink-faint)"
      />
      {/* the loss curve */}
      <path d={curve} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      {/* tangent at a — slope = ∂L/∂a */}
      <line
        x1={x(t0)}
        y1={y(L0 + ga * (t0 - a0))}
        x2={x(t1)}
        y2={y(L0 + ga * (t1 - a0))}
        stroke="var(--color-vermillion)"
        strokeWidth="1.75"
        strokeDasharray="5 4"
      />
      {/* prediction along the tangent (hollow) vs where the curve really goes (moss) */}
      <circle
        cx={x(aN)}
        cy={y(predicted)}
        r="5"
        fill="none"
        stroke="var(--color-vermillion)"
        strokeWidth="2"
      />
      <circle cx={x(aN)} cy={y(actual)} r="4.5" fill="var(--color-moss)" />
      {/* you are here */}
      <circle cx={x(a0)} cy={y(L0)} r="5" fill="var(--color-vermillion)" />
      <text
        x={x(a0) + 9}
        y={y(L0) - 9}
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        fill="var(--color-vermillion)"
      >
        slope = {fmt(ga)}
      </text>
      {/* axis labels */}
      <text
        x={W - PAD.right}
        y={H - 10}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        A — THE ONE DIAL WE TURN →
      </text>
      <text
        x={PAD.left - 30}
        y={PAD.top - 4}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        L
      </text>
    </svg>
  )
}
