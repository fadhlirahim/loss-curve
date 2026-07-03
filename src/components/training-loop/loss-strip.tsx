type Series = {
  label: string
  values: number[]
  color: string
  dash?: string
}

/**
 * Loss (or LR) vs step, multi-series — the training-log strip, generalized
 * from the neural-net lab to overlay train/val and race comparisons.
 */
export function LossStrip({
  series,
  cap,
  floor = 0,
  anchors = [],
  xLabel,
}: {
  series: Series[]
  cap: number
  floor?: number
  anchors?: { y: number; label: string }[]
  xLabel: string
}) {
  const w = 480
  const h = 130
  const pad = { top: 12, right: 14, bottom: 18, left: 14 }
  const n = Math.max(...series.map((s) => s.values.length - 1), 1)

  const sx = (i: number) => pad.left + (i / n) * (w - pad.left - pad.right)
  const sy = (v: number) => {
    const clamped = Math.min(Math.max(v, floor), cap)
    return pad.top + ((cap - clamped) / (cap - floor)) * (h - pad.top - pad.bottom)
  }
  const path = (values: number[]) =>
    values.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={xLabel}>
      <title>{xLabel}</title>
      {anchors.map((a) => (
        <g key={a.label}>
          <line
            x1={pad.left}
            x2={w - pad.right}
            y1={sy(a.y)}
            y2={sy(a.y)}
            stroke="var(--color-paper-edge)"
            strokeDasharray="2 5"
          />
          <text
            x={w - pad.right}
            y={sy(a.y) - 4}
            textAnchor="end"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill="var(--color-ink-faint)"
          >
            {a.label}
          </text>
        </g>
      ))}
      <line
        x1={pad.left}
        x2={w - pad.right}
        y1={h - pad.bottom}
        y2={h - pad.bottom}
        stroke="var(--color-ink-faint)"
      />
      {series.map(
        (s) =>
          s.values.length > 1 && (
            <path
              key={s.label}
              d={path(s.values)}
              fill="none"
              stroke={s.color}
              strokeWidth="1.75"
              strokeDasharray={s.dash}
            />
          ),
      )}
      {series.map((s, i) => (
        <text
          key={s.label}
          x={pad.left + i * 110}
          y={h - 5}
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.08em"
          fill={s.color}
        >
          — {s.label}
        </text>
      ))}
      <text
        x={w - pad.right}
        y={h - 5}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        {xLabel} →
      </text>
    </svg>
  )
}
