import { useState } from 'react'
import {
  ACCUM_START,
  ACCUM_STEPS,
  lsqOptimum,
  MICRO_BATCH,
  mseLoss,
  N_EXAMPLES,
  runAccumulation,
  type Vec,
  XX_MEAN,
} from '@/components/optimization/model'
import { useTicker } from '@/hooks/use-ticker'

const W = 720
const H = 400
const X_MIN = -2.2
const X_MAX = 3.4
const Y_MIN = -2.0
const Y_MAX = 1.9

const px = (v: number) => ((v - X_MIN) / (X_MAX - X_MIN)) * W
const py = (v: number) => ((Y_MAX - v) / (Y_MAX - Y_MIN)) * H

// contours of MSE above its floor: (w−w*)²·E[x²] + (b−b*)² = c
const CONTOURS = [0.1, 0.4, 1, 2, 4, 7]

const RUN = runAccumulation()
const OPT = lsqOptimum()
const FLOOR = mseLoss(OPT)

const pathFor = (points: Vec[]) =>
  points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.x).toFixed(1)},${py(p.y).toFixed(1)}`)
    .join(' ')

/**
 * §3 — one batch-32 step vs four accumulated micro-batches of 8, same seed,
 * same data, 30 steps. The hollow rings land on the filled dots every time:
 * the update is identical; only the peak activation memory differs.
 */
export function AccumulationDemo() {
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)

  const done = step >= ACCUM_STEPS
  const full = RUN.full.slice(0, step + 1)
  const accum = RUN.accum.slice(0, step + 1)

  useTicker(running && !done, () => setStep((s) => Math.min(ACCUM_STEPS, s + 1)), 140)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="Two identical optimization trajectories, batch versus accumulated"
      >
        <title>Gradient accumulation — the same update, on a memory budget</title>
        {CONTOURS.map((c) => (
          <ellipse
            key={c}
            cx={px(OPT.x)}
            cy={py(OPT.y)}
            rx={(Math.sqrt(c / XX_MEAN) / (X_MAX - X_MIN)) * W}
            ry={(Math.sqrt(c) / (Y_MAX - Y_MIN)) * H}
            fill="none"
            stroke="var(--color-paper-edge)"
            strokeWidth="1.25"
          />
        ))}
        <circle
          cx={px(OPT.x)}
          cy={py(OPT.y)}
          r="4"
          fill="none"
          stroke="var(--color-moss)"
          strokeWidth="1.5"
        />
        <circle cx={px(ACCUM_START.x)} cy={py(ACCUM_START.y)} r="4" fill="var(--color-ink-faint)" />

        {/* batch-32: solid line + filled dots */}
        <path
          d={pathFor(full)}
          fill="none"
          stroke="var(--color-vermillion)"
          strokeWidth="1.75"
          opacity="0.85"
        />
        {full.map((p, i) => (
          <circle
            key={`f-${
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed precomputed trajectory; step index is the identity
              i
            }`}
            cx={px(p.x)}
            cy={py(p.y)}
            r="3"
            fill="var(--color-vermillion)"
          />
        ))}
        {/* accumulated: hollow rings that must land on the dots */}
        {accum.map((p, i) => (
          <circle
            key={`a-${
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed precomputed trajectory; step index is the identity
              i
            }`}
            cx={px(p.x)}
            cy={py(p.y)}
            r="6"
            fill="none"
            stroke="var(--color-moss)"
            strokeWidth="1.5"
          />
        ))}
        <text
          x={W - 12}
          y={H - 12}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.08em"
          fill="var(--color-ink-faint)"
        >
          ● BATCH 32 · ○ 4 × MICRO-BATCH 8 — SAME DATA, SAME SEED
        </text>
      </svg>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-paper-edge border-t pt-4">
        <button
          type="button"
          onClick={() => {
            if (done) setStep(0)
            setRunning(!running || done)
          }}
          className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
        >
          {running && !done ? 'pause' : done ? 'again ↺' : 'run both →'}
        </button>
        <button
          type="button"
          onClick={() => setStep((s) => Math.min(ACCUM_STEPS, s + 1))}
          disabled={done}
          className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          step →
        </button>
        <button
          type="button"
          onClick={() => {
            setStep(0)
            setRunning(false)
          }}
          disabled={step === 0}
          className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          reset
        </button>
        <span className="font-mono text-ink-faint text-xs">
          {step}/{ACCUM_STEPS} updates
        </span>
      </div>

      <dl className="mt-4 space-y-3 border-paper-edge border-t pt-4 font-mono text-xs">
        <div className="flex items-center gap-4">
          <dt className="w-44 flex-none text-ink-faint">batch {N_EXAMPLES} at once</dt>
          <dd className="flex-1">
            <div className="h-2.5 bg-vermillion" style={{ width: '100%' }} />
          </dd>
          <dd className="w-40 flex-none text-right text-ink">{N_EXAMPLES} live examples</dd>
        </div>
        <div className="flex items-center gap-4">
          <dt className="w-44 flex-none text-ink-faint">4 × micro-batch {MICRO_BATCH}</dt>
          <dd className="flex-1">
            <div
              className="h-2.5 bg-moss"
              style={{ width: `${(MICRO_BATCH / N_EXAMPLES) * 100}%` }}
            />
          </dd>
          <dd className="w-40 flex-none text-right text-ink">{MICRO_BATCH} live examples</dd>
        </div>
        <div className="flex justify-between gap-4 border-paper-edge border-t pt-3">
          <dt className="text-ink-faint">largest gap between the two trajectories, all 30 steps</dt>
          <dd className="text-moss-deep tabular-nums dark:text-moss">
            {RUN.maxDivergence.toExponential(1)} — floating-point dust
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-faint">loss floor (least-squares optimum)</dt>
          <dd className="text-ink tabular-nums">{FLOOR.toFixed(3)}</dd>
        </div>
      </dl>
    </div>
  )
}
