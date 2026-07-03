import { useState } from 'react'
import { fmt2 } from '@/components/attention/model'
import {
  KAPPA,
  NOISY_START,
  noiseBallLoss,
  noiseStd,
  noisyTrajectory,
  noisyVerdict,
  snrAtStart,
  TRAJ_STEPS,
  type Vec,
} from '@/components/optimization/model'
import { useTicker } from '@/hooks/use-ticker'
import { cn } from '@/lib/utils'

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

const CONTOURS = [0.5, 2, 5, 10, 20, 32]

const pathFor = (points: Vec[]) =>
  points
    .map((p, i) => {
      const c = clamp(p)
      return `${i === 0 ? 'M' : 'L'}${px(c.x).toFixed(1)},${py(c.y).toFixed(1)}`
    })
    .join(' ')

const TONE_CLASS = {
  ok: 'text-moss-deep dark:text-moss',
  warn: 'text-gold',
  bad: 'text-vermillion',
}

/**
 * §1 — the same ravine, but the gradient is a minibatch estimate. One seed
 * for every batch size: dragging B rescales the SAME noise draws, so what
 * changes on screen is exactly and only the noise amplitude.
 */
export function NoisyRavine() {
  const [exp, setExp] = useState(2) // B = 2^exp
  const [step, setStep] = useState(0)
  const [running, setRunning] = useState(false)

  const batch = 2 ** exp
  const path = noisyTrajectory(batch)
  const shown = path.slice(0, step + 1)
  const done = step >= TRAJ_STEPS
  const verdict = noisyVerdict(batch)

  useTicker(running && !done, () => setStep((s) => Math.min(TRAJ_STEPS, s + 2)), 50)

  const head = clamp(shown[shown.length - 1])

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label="A noisy minibatch gradient descending an elongated valley"
      >
        <title>Minibatch SGD — the gradient is an estimate</title>
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
        <circle
          cx={px(0)}
          cy={py(0)}
          r="4"
          fill="none"
          stroke="var(--color-moss)"
          strokeWidth="1.5"
        />
        <circle cx={px(NOISY_START.x)} cy={py(NOISY_START.y)} r="4" fill="var(--color-ink-faint)" />
        <path
          d={pathFor(shown)}
          fill="none"
          stroke="var(--color-vermillion)"
          strokeWidth="1.75"
          opacity="0.85"
        />
        <circle cx={px(head.x)} cy={py(head.y)} r="5" fill="var(--color-vermillion)" />
        <text
          x={W - 12}
          y={H - 12}
          textAnchor="end"
          fontFamily="var(--font-mono)"
          fontSize="10"
          letterSpacing="0.08em"
          fill="var(--color-ink-faint)"
        >
          ĝ = ∇L + (σ/√B)·ξ — SAME SEED, EVERY B
        </text>
      </svg>

      <div className="mt-4 grid gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-[1fr_auto]">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              B <span className="text-ink-faint">· batch size</span>
            </span>
            <span className="text-ink">{batch}</span>
          </span>
          <input
            type="range"
            min={0}
            max={9}
            step={1}
            value={exp}
            onChange={(e) => {
              setExp(Number(e.target.value))
              setStep(0)
            }}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (done) setStep(0)
              setRunning(!running || done)
            }}
            className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
          >
            {running && !done ? 'pause' : done ? 'again ↺' : 'descend →'}
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
            {Math.min(step, TRAJ_STEPS)}/{TRAJ_STEPS} steps
          </span>
        </div>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-2 border-paper-edge border-t pt-4 font-mono text-xs sm:grid-cols-3">
        <div className="flex justify-between gap-3 sm:block">
          <dt className="text-ink-faint">noise per coordinate · σ/√B</dt>
          <dd className="text-ink sm:mt-1">{fmt2(noiseStd(batch))}</dd>
        </div>
        <div className="flex justify-between gap-3 sm:block">
          <dt className="text-ink-faint">signal-to-noise at the start</dt>
          <dd className="text-ink sm:mt-1">{fmt2(snrAtStart(batch))}×</dd>
        </div>
        <div className="flex justify-between gap-3 sm:block">
          <dt className="text-ink-faint">settles into a noise ball of loss</dt>
          <dd className="text-ink sm:mt-1">{noiseBallLoss(path).toFixed(3)}</dd>
        </div>
      </dl>
      <p className={cn('mt-3 font-mono text-xs', TONE_CLASS[verdict.tone])}>▸ {verdict.label}</p>
    </div>
  )
}
