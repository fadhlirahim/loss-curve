const WIDTH = 640
const HEIGHT = 280
const PAD = { top: 24, right: 36, bottom: 40, left: 52 }
const N = 64

// Deterministic "training noise" so SSR and client render identically.
const noise = (i: number) => Math.sin(i * 12.9898) * 0.5 + Math.sin(i * 4.1414) * 0.5

const POINTS = Array.from({ length: N + 1 }, (_, i) => {
  const t = i / N
  const base = Math.exp(-2.6 * t) // the descent
  const jitter = noise(i) * 0.045 * (1 - t * 0.6) // noisier early, calmer late
  return Math.min(1, Math.max(0.03, base + jitter + 0.04))
})

const x = (i: number) => PAD.left + (i / N) * (WIDTH - PAD.left - PAD.right)
const y = (v: number) => PAD.top + (1 - v) * (HEIGHT - PAD.top - PAD.bottom)

const PATH = POINTS.map(
  (v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`,
).join(' ')

/**
 * Overall progress rendered as a training loss curve:
 * loss = what you don't know yet. Your marker descends as artifacts ship.
 */
export function LossCurve({ fraction }: { fraction: number }) {
  const idx = Math.round(Math.min(1, Math.max(0, fraction)) * N)
  const mx = x(idx)
  const my = y(POINTS[idx])
  const loss = POINTS[idx]
  // keep the marker label clear of the axis caption (top-left) and right edge;
  // tuned to fontSize 11 and the "you · loss 0.00" label width in this viewBox
  const CAPTION_CLEARANCE = 44
  const LABEL_WIDTH = 120
  const labelBelow = my < PAD.top + CAPTION_CLEARANCE
  const labelLeft = mx > WIDTH - PAD.right - LABEL_WIDTH

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="w-full"
      role="img"
      aria-label={`Progress as a loss curve: ${Math.round(fraction * 100)}% of checklist artifacts shipped`}
    >
      {/* gridlines */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <line
          key={g}
          x1={PAD.left}
          x2={WIDTH - PAD.right}
          y1={y(g)}
          y2={y(g)}
          stroke="var(--color-paper-edge)"
          strokeDasharray="2 5"
        />
      ))}
      {/* axes */}
      <line
        x1={PAD.left}
        x2={PAD.left}
        y1={PAD.top - 6}
        y2={HEIGHT - PAD.bottom}
        stroke="var(--color-ink-faint)"
      />
      <line
        x1={PAD.left}
        x2={WIDTH - PAD.right + 8}
        y1={HEIGHT - PAD.bottom}
        y2={HEIGHT - PAD.bottom}
        stroke="var(--color-ink-faint)"
      />
      {/* the curve */}
      <path
        d={PATH}
        pathLength={1}
        className="loss-path"
        fill="none"
        stroke="var(--color-ink)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* the part you've already descended */}
      <path
        d={PATH}
        pathLength={1}
        fill="none"
        stroke="var(--color-moss)"
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeDasharray={`${fraction} 1`}
      />
      {/* you-are-here marker */}
      <circle cx={mx} cy={my} r="10" fill="var(--color-vermillion)" opacity="0.15" />
      <circle cx={mx} cy={my} r="4.5" fill="var(--color-vermillion)" />
      <text
        x={labelLeft ? mx - 12 : mx + 12}
        y={labelBelow ? my + 22 : my - 10}
        textAnchor={labelLeft ? 'end' : 'start'}
        fontFamily="var(--font-mono)"
        fontSize="11"
        fill="var(--color-vermillion)"
      >
        you · loss {loss.toFixed(2)}
      </text>
      {/* axis labels */}
      <text
        x={PAD.left}
        y={14}
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        LOSS — WHAT YOU DON'T KNOW YET
      </text>
      <text
        x={WIDTH - PAD.right}
        y={HEIGHT - 12}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        ARTIFACTS SHIPPED →
      </text>
    </svg>
  )
}
