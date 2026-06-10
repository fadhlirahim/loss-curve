import { bowlLoss, fmt } from './model'

const W = 560
const H = 300
const PAD = { top: 16, right: 16, bottom: 30, left: 40 }

const W_MIN = -3.2
const W_MAX = 3.2
const L_MAX = 10
const SAMPLES = 80

const x = (w: number) => PAD.left + ((w - W_MIN) / (W_MAX - W_MIN)) * (W - PAD.left - PAD.right)
const y = (l: number) => PAD.top + ((L_MAX - l) / L_MAX) * (H - PAD.top - PAD.bottom)

const CURVE = Array.from({ length: SAMPLES + 1 }, (_, i) => {
  const w = W_MIN + (i / SAMPLES) * (W_MAX - W_MIN)
  return `${i === 0 ? 'M' : 'L'}${x(w).toFixed(1)},${y(bowlLoss(w)).toFixed(1)}`
}).join(' ')

const clampW = (w: number) => Math.min(W_MAX, Math.max(W_MIN, w))

/**
 * The bowl: L = w². The ball hops along the curve, one hop per descent
 * step; the chords between hops make overshooting and divergence visible
 * at a glance — the trail IS the diagnosis.
 */
export function Bowl({ history }: { history: number[] }) {
  const shown = history.slice(-24) // recent hops; older ones have faded anyway
  const offset = history.length - shown.length // absolute step number of shown[0]
  const hops = shown.slice(1).map((w, i) => ({ step: offset + i + 1, from: shown[i], to: w }))
  const current = history[history.length - 1]
  const escaped = Math.abs(current) > W_MAX

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`Gradient descent on the bowl, currently at w = ${fmt(current)}`}
    >
      <title>Descending the bowl L = w²</title>
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        stroke="var(--color-ink-faint)"
      />
      <path d={CURVE} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      {/* the bottom we're aiming for */}
      <circle cx={x(0)} cy={y(0)} r="3" fill="none" stroke="var(--color-moss)" strokeWidth="1.5" />
      {/* hops */}
      {hops.map((hop, i) => (
        <line
          key={hop.step}
          x1={x(clampW(hop.from))}
          y1={y(Math.min(L_MAX, bowlLoss(clampW(hop.from))))}
          x2={x(clampW(hop.to))}
          y2={y(Math.min(L_MAX, bowlLoss(clampW(hop.to))))}
          stroke="var(--color-vermillion)"
          strokeWidth="1.5"
          opacity={0.15 + 0.55 * ((i + 2) / shown.length)}
        />
      ))}
      {/* the ball */}
      <circle
        cx={x(clampW(current))}
        cy={y(Math.min(L_MAX, bowlLoss(clampW(current))))}
        r="6"
        fill="var(--color-vermillion)"
      />
      {escaped && (
        <text
          x={current > 0 ? W - PAD.right : PAD.left + 4}
          y={PAD.top + 10}
          textAnchor={current > 0 ? 'end' : 'start'}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--color-vermillion)"
        >
          ↗ gone — |w| = {Math.abs(current) > 1000 ? '…a lot' : fmt(Math.abs(current))}
        </text>
      )}
      <text
        x={W - PAD.right}
        y={H - 8}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        W — THE ONE DIAL →
      </text>
    </svg>
  )
}

/**
 * Loss vs step — the curve you'd actually watch during training, and the
 * one the Phase 1 milestone asks you to diagnose a bad learning rate from.
 */
export function LossCurveStrip({ history }: { history: number[] }) {
  const sw = 560
  const sh = 110
  const pad = { top: 12, right: 16, bottom: 18, left: 40 }
  const n = Math.max(history.length - 1, 1)
  const cap = L_MAX * 1.4

  const px = (i: number) => pad.left + (i / n) * (sw - pad.left - pad.right)
  const py = (l: number) => pad.top + ((cap - Math.min(l, cap)) / cap) * (sh - pad.top - pad.bottom)
  const path = history
    .map((w, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(bowlLoss(w)).toFixed(1)}`)
    .join(' ')

  return (
    <svg
      viewBox={`0 0 ${sw} ${sh}`}
      className="w-full"
      role="img"
      aria-label="Loss per step for the current run"
    >
      <title>The loss curve a training log would show</title>
      <line
        x1={pad.left}
        x2={sw - pad.right}
        y1={sh - pad.bottom}
        y2={sh - pad.bottom}
        stroke="var(--color-ink-faint)"
      />
      <path d={path} fill="none" stroke="var(--color-vermillion)" strokeWidth="1.75" />
      <text
        x={sw - pad.right}
        y={sh - 5}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        LOSS PER STEP — WHAT YOUR TRAINING LOG SHOWS →
      </text>
    </svg>
  )
}
