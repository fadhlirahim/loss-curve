import { KAPPA, RACERS, RAVINE_START, type RaceState, racePath, type Vec } from './model'

const W = 720
const H = 360
const X_MIN = -3.1
const X_MAX = 3.1
const Y_MIN = -1.7
const Y_MAX = 1.7

const px = (v: number) => ((v - X_MIN) / (X_MAX - X_MIN)) * W
const py = (v: number) => ((Y_MAX - v) / (Y_MAX - Y_MIN)) * H

const clamp = (p: Vec): Vec => ({
  x: Math.min(X_MAX, Math.max(X_MIN, p.x)),
  y: Math.min(Y_MAX, Math.max(Y_MIN, p.y)),
})

// contour L = c of ½(x² + κy²) is an ellipse with semi-axes √(2c), √(2c/κ)
const CONTOURS = [0.5, 2, 5, 10, 20, 32]

function pathFor(points: Vec[]): string {
  return points
    .map((p, i) => {
      const c = clamp(p)
      return `${i === 0 ? 'M' : 'L'}${px(c.x).toFixed(1)},${py(c.y).toFixed(1)}`
    })
    .join(' ')
}

/**
 * The ravine: contour lines of an ill-conditioned quadratic, κ = 12 times
 * steeper across the valley than along it. Three optimizers, same start,
 * same learning rate — their trajectories are the whole argument.
 */
export function Ravine({ race }: { race: RaceState }) {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Three optimizers descending an elongated valley"
    >
      <title>The ravine — SGD vs momentum vs Adam</title>
      {CONTOURS.map((c) => (
        <ellipse
          key={c}
          cx={px(0)}
          cy={py(0)}
          rx={(Math.sqrt(2 * c) / (X_MAX - X_MIN)) * W}
          ry={(Math.sqrt((2 * c) / KAPPA) / (Y_MAX - Y_MIN)) * H}
          fill="none"
          stroke="var(--color-paper-edge)"
          strokeWidth="1.25"
        />
      ))}
      {/* the floor of the valley */}
      <circle
        cx={px(0)}
        cy={py(0)}
        r="4"
        fill="none"
        stroke="var(--color-moss)"
        strokeWidth="1.5"
      />
      {/* shared starting block */}
      <circle cx={px(RAVINE_START.x)} cy={py(RAVINE_START.y)} r="4" fill="var(--color-ink-faint)" />
      {RACERS.map((r) => {
        const path = racePath(race, r.id)
        const head = clamp(path[path.length - 1])
        return (
          <g key={r.id}>
            <path
              d={pathFor(path)}
              fill="none"
              stroke={r.color}
              strokeWidth="1.75"
              opacity="0.85"
            />
            <circle cx={px(head.x)} cy={py(head.y)} r="5" fill={r.color} />
          </g>
        )
      })}
      <text
        x={W - 12}
        y={H - 12}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        L = ½(x² + {KAPPA}y²) — STEEP ACROSS, SHALLOW ALONG
      </text>
    </svg>
  )
}
