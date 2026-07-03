import { useMemo, useState } from 'react'
import {
  chinchillaLoss,
  computeOptimal,
  fmtCount,
  fmtFlops,
  fmtLoss,
  isoComputeCurve,
} from '@/components/scaling-laws/model'

const W = 640
const H = 280
const PAD = { top: 24, right: 36, bottom: 40, left: 52 }

/** §2 — one compute budget, spent across every possible model size. */
export function UCurve({ logC, setLogC }: { logC: number; setLogC: (v: number) => void }) {
  const [yourLogN, setYourLogN] = useState(10.15)

  const c = 10 ** logC
  const { curve, opt } = useMemo(() => ({ curve: isoComputeCurve(c), opt: computeOptimal(c) }), [c])

  const loN = Math.log10(curve[0].n)
  const hiN = Math.log10(curve[curve.length - 1].n)
  const clampedYourN = Math.min(hiN, Math.max(loN, yourLogN))
  const yourN = 10 ** clampedYourN
  const yourLoss = chinchillaLoss(yourN, c / (6 * yourN))
  const penalty = yourLoss - opt.loss

  const loL = opt.loss - 0.03
  const hiL = Math.max(...curve.map((p) => p.loss))
  const x = (n: number) =>
    PAD.left + ((Math.log10(n) - loN) / (hiN - loN)) * (W - PAD.left - PAD.right)
  const y = (l: number) => PAD.top + ((l - loL) / (hiL - loL)) * (H - PAD.top - PAD.bottom)
  const path = curve
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.n).toFixed(1)},${y(p.loss).toFixed(1)}`)
    .join(' ')

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              C <span className="text-ink-faint">· compute budget, FLOPs</span>
            </span>
            <span className="text-ink">{fmtFlops(c)}</span>
          </span>
          <input
            type="range"
            min={17}
            max={24}
            step={0.1}
            value={logC}
            onChange={(e) => setLogC(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              your N <span className="text-ink-faint">· where you'd size it</span>
            </span>
            <span className="text-ink">{fmtCount(yourN)}</span>
          </span>
          <input
            type="range"
            min={loN}
            max={hiN}
            step={0.02}
            value={clampedYourN}
            onChange={(e) => setYourLogN(Number(e.target.value))}
            className="mt-1 w-full accent-gold"
          />
        </label>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-5 w-full"
        role="img"
        aria-label="Loss versus model size along one iso-compute curve"
      >
        {[0.25, 0.5, 0.75].map((g) => (
          <line
            key={g}
            x1={PAD.left}
            x2={W - PAD.right}
            y1={PAD.top + g * (H - PAD.top - PAD.bottom)}
            y2={PAD.top + g * (H - PAD.top - PAD.bottom)}
            stroke="var(--color-paper-edge)"
            strokeDasharray="2 5"
          />
        ))}
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
        <path
          d={path}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* the optimum */}
        <line
          x1={x(opt.n)}
          x2={x(opt.n)}
          y1={y(opt.loss)}
          y2={H - PAD.bottom}
          stroke="var(--color-vermillion)"
          strokeDasharray="3 4"
        />
        <circle
          cx={x(opt.n)}
          cy={y(opt.loss)}
          r="10"
          fill="var(--color-vermillion)"
          opacity="0.15"
        />
        <circle cx={x(opt.n)} cy={y(opt.loss)} r="4.5" fill="var(--color-vermillion)" />
        <text
          x={x(opt.n) + 10}
          y={y(opt.loss) + 20}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--color-vermillion)"
        >
          N* = {fmtCount(opt.n)} · {opt.ratio.toFixed(0)} tok/param
        </text>
        {/* you */}
        <circle cx={x(yourN)} cy={y(yourLoss)} r="4.5" fill="var(--color-gold)" />
        <text
          x={x(yourN) > W - 150 ? x(yourN) - 10 : x(yourN) + 10}
          y={y(yourLoss) - 10}
          textAnchor={x(yourN) > W - 150 ? 'end' : 'start'}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--color-gold)"
        >
          you · +{penalty.toFixed(3)} loss
        </text>
        <text
          x={PAD.left}
          y={14}
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          letterSpacing="0.08em"
          fill="var(--color-ink-faint)"
        >
          LOSS AT FIXED BUDGET {fmtFlops(c)}
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
          MODEL SIZE N (LOG) →
        </text>
      </svg>

      <div className="mt-4 flex flex-wrap gap-x-10 gap-y-3 border-paper-edge border-t pt-4 font-mono text-xs">
        <span className="text-ink-soft">
          optimal split: <span className="text-ink tabular-nums">{fmtCount(opt.n)} params</span> ×{' '}
          <span className="text-ink tabular-nums">{fmtCount(opt.d)} tokens</span>
        </span>
        <span className="text-ink-soft">
          ratio: <span className="text-ink tabular-nums">{opt.ratio.toFixed(1)} tok/param</span>
        </span>
        <span className="text-ink-soft">
          best loss: <span className="text-ink tabular-nums">{fmtLoss(opt.loss)}</span>
        </span>
      </div>
    </div>
  )
}
