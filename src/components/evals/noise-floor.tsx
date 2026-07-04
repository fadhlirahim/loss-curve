import { useState } from 'react'
import { ciHalfWidth, pCorrectRanking, simulateRuns } from '@/components/evals/model'
import { cn } from '@/lib/utils'

const W = 640
const LANE_H = 46
const PAD_X = 14
const DOMAIN: [number, number] = [0.25, 1.0]

const toX = (acc: number) => PAD_X + ((acc - DOMAIN[0]) / (DOMAIN[1] - DOMAIN[0])) * (W - 2 * PAD_X)

function Lane({
  label,
  runs,
  trueP,
  half,
  color,
  y,
}: {
  label: string
  runs: number[]
  trueP: number
  half: number
  color: string
  y: number
}) {
  return (
    <g>
      <rect
        x={toX(trueP - half)}
        y={y + 6}
        width={toX(trueP + half) - toX(trueP - half)}
        height={LANE_H - 12}
        fill={color}
        opacity={0.13}
      />
      <line
        x1={toX(trueP)}
        x2={toX(trueP)}
        y1={y + 2}
        y2={y + LANE_H - 2}
        stroke={color}
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      {runs.map((acc, i) => (
        <circle
          key={`${label}-${
            // biome-ignore lint/suspicious/noArrayIndexKey: runs are an unordered sample; index is the identity
            i
          }`}
          cx={toX(acc)}
          cy={y + 10 + ((i * 7919) % (LANE_H - 20))}
          r={3}
          fill={color}
          opacity={0.75}
        />
      ))}
      <text x={PAD_X} y={y + 14} className="fill-ink-faint font-mono text-[9px]">
        {label}
      </text>
    </g>
  )
}

/** §1 — 20 real binomial eval runs per model, against the analytic 95% band. */
export function NoiseFloor() {
  const [nExp, setNExp] = useState(2.3) // 10^2.3 ≈ 200
  const [p, setP] = useState(0.62)
  const [deltaPts, setDeltaPts] = useState(2)
  const [seed, setSeed] = useState(7)

  const n = Math.round(10 ** nExp)
  const delta = deltaPts / 100
  const pB = Math.min(0.999, p + delta)
  const half = ciHalfWidth(p, n)
  const runsA = simulateRuns(p, n, 20, seed)
  const runsB = simulateRuns(pB, n, 20, seed + 1)
  const pRank = pCorrectRanking(p, delta, n)

  const H = LANE_H * 2 + 26

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>N · questions</span>
            <span className="text-ink">{n}</span>
          </span>
          <input
            type="range"
            min={1.7}
            max={3.7}
            step={0.05}
            value={nExp}
            onChange={(e) => setNExp(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>p · true ability A</span>
            <span className="text-ink">{(p * 100).toFixed(0)}%</span>
          </span>
          <input
            type="range"
            min={0.3}
            max={0.9}
            step={0.01}
            value={p}
            onChange={(e) => setP(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>δ · B's real lead</span>
            <span className="text-ink">+{deltaPts.toFixed(1)} pts</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={5}
            step={0.5}
            value={deltaPts}
            onChange={(e) => setDeltaPts(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 2)}
          className="self-end bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
        >
          re-run both evals ↻
        </button>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[480px]"
          role="img"
          aria-label="Measured accuracy of 20 simulated eval runs per model"
        >
          <Lane
            label="model A"
            runs={runsA}
            trueP={p}
            half={half}
            color="var(--color-vermillion)"
            y={0}
          />
          <Lane
            label={`model B (truly +${deltaPts.toFixed(1)})`}
            runs={runsB}
            trueP={pB}
            half={ciHalfWidth(pB, n)}
            color="var(--color-moss)"
            y={LANE_H + 6}
          />
          {[0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0].map((t) => (
            <g key={t}>
              <line
                x1={toX(t)}
                x2={toX(t)}
                y1={H - 18}
                y2={H - 14}
                stroke="var(--color-paper-edge)"
              />
              <text
                x={toX(t)}
                y={H - 4}
                textAnchor="middle"
                className="fill-ink-faint font-mono text-[9px]"
              >
                {(t * 100).toFixed(0)}%
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          On N = {n}, a true {(p * 100).toFixed(0)}% model measures anywhere in{' '}
          <strong className="text-ink">
            {((p - half) * 100).toFixed(0)}–{((p + half) * 100).toFixed(0)}%
          </strong>{' '}
          (95% band, ±{(half * 100).toFixed(1)} pts). A single eval run ranks B above A only{' '}
          <strong className={cn(pRank < 0.8 ? 'text-vermillion' : 'text-ink')}>
            {(pRank * 100).toFixed(0)}%
          </strong>{' '}
          of the time
          {pRank < 0.8 ? ' — coin-flip territory dressed as a result.' : '.'}
        </p>
      </div>
    </div>
  )
}
