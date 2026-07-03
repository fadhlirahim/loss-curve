import { useState } from 'react'
import { fmt2 } from '@/components/attention/model'
import { streamNorms } from '@/components/transformer-block/model'

const W = 640
const H = 280
const PAD = { top: 24, right: 96, bottom: 40, left: 56 }

const LOG_MIN = -6
const LOG_MAX = 6

const clampLog = (n: number) => Math.min(LOG_MAX, Math.max(LOG_MIN, Math.log10(n)))

const fmtNorm = (n: number) =>
  n >= 0.01 && n < 1000 ? n.toFixed(2) : n.toExponential(1).replace('e+', 'e')

/**
 * §1 — signal magnitude vs depth, one scalar gain per layer. The bare stack
 * multiplies gains (exponential); the residual stack adds damped edits
 * (gentle drift). Log y-axis, so exponentials are straight lines.
 */
export function ResidualStreamLab() {
  const [gain, setGain] = useState(0.9)
  const [depth, setDepth] = useState(24)
  const [residual, setResidual] = useState(true)

  const bare = streamNorms(gain, depth, false)
  const res = streamNorms(gain, depth, true)

  const x = (k: number) => PAD.left + (k / depth) * (W - PAD.left - PAD.right)
  const y = (n: number) =>
    PAD.top + ((LOG_MAX - clampLog(n)) / (LOG_MAX - LOG_MIN)) * (H - PAD.top - PAD.bottom)

  const path = (norms: number[]) =>
    norms.map((n, k) => `${k === 0 ? 'M' : 'L'}${x(k).toFixed(1)},${y(n).toFixed(1)}`).join(' ')

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Signal magnitude across ${depth} layers at gain ${fmt2(gain)}: bare stack reaches ${fmtNorm(bare[depth])}, residual stack ${fmtNorm(res[depth])}`}
      >
        {/* gridlines at powers of ten */}
        {[-6, -3, 0, 3, 6].map((p) => (
          <g key={p}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(10 ** p)}
              y2={y(10 ** p)}
              stroke="var(--color-paper-edge)"
              strokeDasharray={p === 0 ? undefined : '2 5'}
            />
            <text
              x={PAD.left - 8}
              y={y(10 ** p) + 3.5}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="10"
              fill="var(--color-ink-faint)"
            >
              {p === 0 ? '1' : `1e${p}`}
            </text>
          </g>
        ))}
        {/* axes */}
        <line
          x1={PAD.left}
          x2={PAD.left}
          y1={PAD.top - 6}
          y2={H - PAD.bottom}
          stroke="var(--color-ink-faint)"
        />
        <line
          x1={PAD.left}
          x2={W - PAD.right + 8}
          y1={H - PAD.bottom}
          y2={H - PAD.bottom}
          stroke="var(--color-ink-faint)"
        />
        {/* bare stack — the pathology */}
        <path d={path(bare)} fill="none" stroke="var(--color-vermillion)" strokeWidth="2" />
        <text
          x={x(depth) + 8}
          y={y(bare[depth]) + 3.5}
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          fill="var(--color-vermillion)"
        >
          bare stack
        </text>
        {/* residual stream — the fix */}
        {residual && (
          <>
            <path d={path(res)} fill="none" stroke="var(--color-moss)" strokeWidth="2.5" />
            <text
              x={x(depth) + 8}
              y={y(res[depth]) + (Math.abs(y(res[depth]) - y(bare[depth])) < 14 ? 16 : 3.5)}
              fontFamily="var(--font-mono)"
              fontSize="10.5"
              fill="var(--color-moss)"
            >
              + residuals
            </text>
          </>
        )}
        {/* axis labels */}
        <text
          x={PAD.left}
          y={14}
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          letterSpacing="0.08em"
          fill="var(--color-ink-faint)"
        >
          SIGNAL MAGNITUDE (LOG)
        </text>
        <text
          x={W - PAD.right}
          y={H - 12}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          letterSpacing="0.08em"
          fill="var(--color-ink-faint)"
        >
          LAYER →
        </text>
      </svg>

      {/* dials */}
      <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-3">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              g <span className="text-ink-faint">· what each layer does</span>
            </span>
            <span className="text-ink">×{fmt2(gain)}</span>
          </span>
          <input
            type="range"
            min={0.5}
            max={1.5}
            step={0.01}
            value={gain}
            onChange={(e) => setGain(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              N <span className="text-ink-faint">· depth</span>
            </span>
            <span className="text-ink">{depth} layers</span>
          </span>
          <input
            type="range"
            min={1}
            max={48}
            step={1}
            value={depth}
            onChange={(e) => setDepth(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 self-end pb-1 font-mono text-ink-soft text-xs">
          <input
            type="checkbox"
            checked={residual}
            onChange={(e) => setResidual(e.target.checked)}
            className="accent-vermillion"
          />
          residual connections
        </label>
      </div>

      {/* readout */}
      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3 font-mono text-xs">
        <p className="text-ink-soft">
          after {depth} layers, a unit signal becomes{' '}
          <span className="text-vermillion">{fmtNorm(bare[depth])}</span> bare
          {residual && (
            <>
              {' '}
              vs <span className="text-moss-deep dark:text-moss">{fmtNorm(res[depth])}</span> with
              residuals
            </>
          )}
          {' — '}
          {gain === 1
            ? 'at g = 1 even the bare stack survives, but no real layer is that polite.'
            : gain < 1
              ? 'the bare stack starves the top layers of signal (and, mirrored, the bottom layers of gradient).'
              : 'the bare stack saturates every nonlinearity on the way up.'}
        </p>
      </div>
    </div>
  )
}
