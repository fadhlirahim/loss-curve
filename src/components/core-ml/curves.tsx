const W = 480
const H = 170
const PAD = { top: 14, right: 14, bottom: 20, left: 14 }
const CAP = 1.3

/**
 * Train and val loss on the same axes — the single most diagnostic chart
 * in deep learning. The moss dot marks the best val loss seen so far:
 * the moment early stopping would have called it.
 */
export function TrainValCurves({
  trainLosses,
  valLosses,
  bestIdx,
  perTick,
}: {
  trainLosses: number[]
  valLosses: number[]
  bestIdx: number
  perTick: number
}) {
  const n = Math.max(trainLosses.length - 1, 1)
  const x = (i: number) => PAD.left + (i / n) * (W - PAD.left - PAD.right)
  const y = (l: number) => PAD.top + ((CAP - Math.min(l, CAP)) / CAP) * (H - PAD.top - PAD.bottom)
  const path = (ls: number[]) =>
    ls.map((l, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(l).toFixed(1)}`).join(' ')

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Train and validation loss per epoch"
    >
      <title>Homework vs exam, per epoch</title>
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={y(Math.LN2)}
        y2={y(Math.LN2)}
        stroke="var(--color-paper-edge)"
        strokeDasharray="2 5"
      />
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        stroke="var(--color-ink-faint)"
      />
      {valLosses.length > 1 && (
        <path d={path(valLosses)} fill="none" stroke="var(--color-gold)" strokeWidth="1.75" />
      )}
      {trainLosses.length > 1 && (
        <path
          d={path(trainLosses)}
          fill="none"
          stroke="var(--color-vermillion)"
          strokeWidth="1.75"
        />
      )}
      {valLosses.length > 0 && bestIdx >= 0 && (
        <circle cx={x(bestIdx)} cy={y(valLosses[bestIdx])} r="4" fill="var(--color-moss)" />
      )}
      <text
        x={PAD.left}
        y={H - 6}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.06em"
        fill="var(--color-ink-faint)"
      >
        <tspan fill="var(--color-vermillion)">— train (homework)</tspan>
        <tspan dx="10" fill="var(--color-gold)">
          — val (exam)
        </tspan>
        <tspan dx="10" fill="var(--color-moss)">
          ● early-stopping point
        </tspan>
      </text>
      <text
        x={W - PAD.right}
        y={H - 6}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.06em"
        fill="var(--color-ink-faint)"
      >
        {perTick} EPOCHS / PT →
      </text>
    </svg>
  )
}
