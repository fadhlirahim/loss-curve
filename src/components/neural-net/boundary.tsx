import { type Activation, type Net, type Point, predictGrid } from './model'

const SIZE = 480
const RES = 30
const CELL = SIZE / RES

const px = (v: number) => ((v + 1.1) / 2.2) * SIZE
const py = (v: number) => ((1.1 - v) / 2.2) * SIZE

/**
 * The decision boundary as a heatmap: each cell tinted by the net's
 * current class probability, the training points on top. Watching this
 * grid get carved IS watching the function take shape.
 */
export function Boundary({
  net,
  data,
  activation,
  valData,
}: {
  net: Net
  data: Point[]
  activation: Activation
  /** held-out points, drawn as hollow rings — the exam the net never sees */
  valData?: Point[]
}) {
  const grid = predictGrid(net, activation, RES)

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="w-full"
      role="img"
      aria-label="Decision boundary of the network over the training data"
    >
      <title>The decision boundary</title>
      <rect width={SIZE} height={SIZE} fill="var(--color-paper-bright)" />
      {grid.map((p, i) => {
        const gx = i % RES
        const gy = Math.floor(i / RES)
        const confident = Math.abs(p - 0.5) * 2
        return (
          <rect
            // eslint-style stable key: cell position never changes
            key={`${gx}-${gy}`}
            x={gx * CELL}
            y={gy * CELL}
            width={CELL + 0.5}
            height={CELL + 0.5}
            fill={p > 0.5 ? 'var(--color-vermillion)' : 'var(--color-moss)'}
            opacity={0.06 + confident * 0.3}
          />
        )
      })}
      {data.map((pt) => (
        <circle
          key={`${pt.x}:${pt.y}`}
          cx={px(pt.x)}
          cy={py(pt.y)}
          r="4"
          fill={pt.label === 1 ? 'var(--color-vermillion)' : 'var(--color-moss)'}
          stroke="var(--color-paper-bright)"
          strokeWidth="1.25"
        />
      ))}
      {valData?.map((pt) => (
        <circle
          key={`${pt.x}:${pt.y}`}
          cx={px(pt.x)}
          cy={py(pt.y)}
          r="3.5"
          fill="none"
          stroke={pt.label === 1 ? 'var(--color-vermillion)' : 'var(--color-moss)'}
          strokeWidth="1.75"
        />
      ))}
      <rect
        width={SIZE}
        height={SIZE}
        fill="none"
        stroke="var(--color-paper-edge)"
        strokeWidth="2"
      />
    </svg>
  )
}

/** Loss vs epoch — the same training-log strip as the optimizer lab. */
export function NetLossStrip({ losses, perTick }: { losses: number[]; perTick: number }) {
  const w = 480
  const h = 110
  const pad = { top: 12, right: 14, bottom: 18, left: 14 }
  const cap = 0.75
  const n = Math.max(losses.length - 1, 1)

  const sx = (i: number) => pad.left + (i / n) * (w - pad.left - pad.right)
  const sy = (l: number) => pad.top + ((cap - Math.min(l, cap)) / cap) * (h - pad.top - pad.bottom)
  const path = losses.map((l, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(l).toFixed(1)}`)

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className="w-full"
      role="img"
      aria-label="Training loss per epoch"
    >
      <title>Loss per epoch</title>
      <line
        x1={pad.left}
        x2={w - pad.right}
        y1={sy(Math.LN2)}
        y2={sy(Math.LN2)}
        stroke="var(--color-paper-edge)"
        strokeDasharray="2 5"
      />
      <text
        x={w - pad.right}
        y={sy(Math.LN2) - 5}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="9"
        fill="var(--color-ink-faint)"
      >
        ln 2 — the coin-flip line
      </text>
      <line
        x1={pad.left}
        x2={w - pad.right}
        y1={h - pad.bottom}
        y2={h - pad.bottom}
        stroke="var(--color-ink-faint)"
      />
      {losses.length > 1 && (
        <path d={path.join(' ')} fill="none" stroke="var(--color-vermillion)" strokeWidth="1.75" />
      )}
      <text
        x={w - pad.right}
        y={h - 5}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        LOSS · {perTick} EPOCHS PER POINT →
      </text>
    </svg>
  )
}
