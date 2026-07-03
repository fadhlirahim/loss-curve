import { useMemo, useState } from 'react'
import {
  fmtCount,
  fmtFlops,
  inferenceAwareOptimal,
  inferenceCostCurve,
} from '@/components/scaling-laws/model'

const W = 640
const H = 260
const PAD = { top: 24, right: 36, bottom: 40, left: 52 }

const CAVEATS = [
  {
    title: 'Repeated epochs bend it',
    note: 'The fit assumes fresh tokens. Past ~4 epochs on the same data, extra passes buy less — data-constrained scaling has its own paper (Muennighoff et al.).',
  },
  {
    title: 'Loss ≠ downstream ability',
    note: 'The law predicts pretraining loss. Benchmarks, reasoning, and chat quality correlate with it — loosely, and less at the frontier. Phase 4 is about measuring what you actually care about.',
  },
  {
    title: 'The constants are one dataset',
    note: 'E, A, B, α, β were fitted on MassiveText. Different data (or tokenizer) refits them. Carry the shape between projects, never the digits.',
  },
]

/** §4 — add inference to the bill and watch the optimum slide small. */
export function BendPanel() {
  const [inferenceOn, setInferenceOn] = useState(false)
  const [targetLoss, setTargetLoss] = useState(2.2)
  const [logDInf, setLogDInf] = useState(11)

  const dInf = inferenceOn ? 10 ** logDInf : 0
  const { curve, trainOnly, opt } = useMemo(
    () => ({
      curve: inferenceCostCurve(targetLoss, dInf),
      trainOnly: inferenceCostCurve(targetLoss, 0),
      opt: inferenceAwareOptimal(targetLoss, dInf),
    }),
    [targetLoss, dInf],
  )

  const loN = Math.log10(curve[0].n)
  const hiN = Math.log10(curve[curve.length - 1].n)
  const allTotals = [...curve, ...trainOnly].map((p) => Math.log10(p.total))
  const loT = Math.min(...allTotals) - 0.05
  const hiT = Math.max(...allTotals) + 0.05
  const x = (n: number) =>
    PAD.left + ((Math.log10(n) - loN) / (hiN - loN)) * (W - PAD.left - PAD.right)
  const y = (t: number) =>
    H - PAD.bottom - ((Math.log10(t) - loT) / (hiT - loT)) * (H - PAD.top - PAD.bottom)
  const toPath = (pts: { n: number; total: number }[]) =>
    pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.n).toFixed(1)},${y(p.total).toFixed(1)}`)
      .join(' ')

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              target loss <span className="text-ink-faint">· quality bar to hit</span>
            </span>
            <span className="text-ink">{targetLoss.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={2.0}
            max={2.6}
            step={0.01}
            value={targetLoss}
            onChange={(e) => setTargetLoss(Number(e.target.value))}
            className="mt-1 w-56 accent-vermillion"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-mono text-ink-soft text-xs">
          <input
            type="checkbox"
            checked={inferenceOn}
            onChange={(e) => setInferenceOn(e.target.checked)}
            className="accent-vermillion"
          />
          the model will be served
        </label>
        {inferenceOn && (
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>
                lifetime inference <span className="text-ink-faint">· tokens served</span>
              </span>
              <span className="text-ink">{fmtCount(10 ** logDInf)}</span>
            </span>
            <input
              type="range"
              min={9}
              max={13}
              step={0.1}
              value={logDInf}
              onChange={(e) => setLogDInf(Number(e.target.value))}
              className="mt-1 w-56 accent-vermillion"
            />
          </label>
        )}
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-5 w-full"
        role="img"
        aria-label="Total FLOPs to reach a target loss, versus model size"
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
        {inferenceOn && (
          <path
            d={toPath(trainOnly)}
            fill="none"
            stroke="var(--color-ink-faint)"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
        )}
        <path
          d={toPath(curve)}
          fill="none"
          stroke="var(--color-ink)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle
          cx={x(opt.n)}
          cy={y(opt.total)}
          r="10"
          fill="var(--color-vermillion)"
          opacity="0.15"
        />
        <circle cx={x(opt.n)} cy={y(opt.total)} r="4.5" fill="var(--color-vermillion)" />
        <text
          x={x(opt.n) + 10}
          y={y(opt.total) - 10}
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill="var(--color-vermillion)"
        >
          cheapest: {fmtCount(opt.n)} · {opt.ratio.toFixed(0)} tok/param
        </text>
        <text
          x={PAD.left}
          y={14}
          fontFamily="var(--font-mono)"
          fontSize="10.5"
          letterSpacing="0.08em"
          fill="var(--color-ink-faint)"
        >
          TOTAL FLOPS TO REACH LOSS {targetLoss.toFixed(2)} (LOG)
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
          size it at <span className="text-ink tabular-nums">{fmtCount(opt.n)}</span>, train on{' '}
          <span className="text-ink tabular-nums">{fmtCount(opt.d)}</span> tokens
        </span>
        <span className="text-ink-soft">
          train {fmtFlops(opt.train)}
          {inferenceOn && <> · serve {fmtFlops(opt.inference)}</>} FLOPs
        </span>
      </div>

      <div className="mt-6 grid gap-4 border-paper-edge border-t pt-5 sm:grid-cols-3">
        {CAVEATS.map((c) => (
          <div key={c.title} className="border border-paper-edge bg-paper-deep/30 p-4">
            <h4 className="font-display font-semibold text-sm">{c.title}</h4>
            <p className="mt-1.5 text-[0.83rem] text-ink-soft leading-relaxed">{c.note}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
