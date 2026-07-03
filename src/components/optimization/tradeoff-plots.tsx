import { useState } from 'react'
import {
  batchVerdict,
  examplesToTarget,
  S_MIN,
  stepsToTarget,
} from '@/components/optimization/model'
import { cn } from '@/lib/utils'

const W = 720
const H = 190
const PAD_L = 56
const PAD_R = 16
const PAD_Y = 22

const B_MIN_EXP = 0
const B_MAX_EXP = 12 // B: 1 … 4096

const TONE_CLASS = {
  ok: 'text-moss-deep dark:text-moss',
  warn: 'text-gold',
  bad: 'text-vermillion',
}

const px = (b: number) =>
  PAD_L + ((Math.log2(b) - B_MIN_EXP) / (B_MAX_EXP - B_MIN_EXP)) * (W - PAD_L - PAD_R)

type Curve = { f: (b: number) => number; label: string; minLabel: string }

function CurvePlot({ f, label, minLabel, bCrit, yourB }: Curve & { bCrit: number; yourB: number }) {
  const samples = Array.from({ length: 97 }, (_, i) => 2 ** (B_MIN_EXP + (i / 96) * B_MAX_EXP))
  const values = samples.map(f)
  const yMin = Math.min(...values)
  const yMax = Math.max(...values)
  const py = (v: number) =>
    H -
    PAD_Y -
    ((Math.log10(v) - Math.log10(yMin)) / (Math.log10(yMax) - Math.log10(yMin))) * (H - 2 * PAD_Y)

  const d = samples
    .map((b, i) => `${i === 0 ? 'M' : 'L'}${px(b).toFixed(1)},${py(values[i]).toFixed(1)}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label}>
      <title>{label}</title>
      {/* floor the curve saturates toward */}
      <line
        x1={PAD_L}
        y1={py(yMin)}
        x2={W - PAD_R}
        y2={py(yMin)}
        stroke="var(--color-paper-edge)"
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      {/* the knee */}
      <line
        x1={px(bCrit)}
        y1={PAD_Y - 8}
        x2={px(bCrit)}
        y2={H - PAD_Y}
        stroke="var(--color-ink-faint)"
        strokeWidth="1"
        strokeDasharray="4 4"
      />
      <path d={d} fill="none" stroke="var(--color-vermillion)" strokeWidth="2" />
      <circle cx={px(yourB)} cy={py(f(yourB))} r="5" fill="var(--color-ink)" />
      <text
        x={PAD_L}
        y={14}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        {label.toUpperCase()}
      </text>
      <text
        x={W - PAD_R}
        y={py(yMin) - 6}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--color-ink-faint)"
      >
        {minLabel}
      </text>
      <text
        x={px(bCrit) + 5}
        y={PAD_Y}
        fontFamily="var(--font-mono)"
        fontSize="10"
        fill="var(--color-ink-faint)"
      >
        B_crit
      </text>
    </svg>
  )
}

/**
 * §2 — McCandlish et al.'s tradeoff: below the critical batch size,
 * parallelism buys wall-clock almost for free; above it, every doubling
 * of B mostly burns examples. Log–log, so the knee is visible.
 */
export function TradeoffPlots() {
  const [critExp, setCritExp] = useState(8) // B_crit = 256
  const [yourExp, setYourExp] = useState(5) // your B = 32

  const bCrit = 2 ** critExp
  const yourB = 2 ** yourExp
  const verdict = batchVerdict(yourB, bCrit)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <CurvePlot
        f={(b) => stepsToTarget(b, bCrit)}
        label="steps to target · S(B) = S_min (1 + B_crit / B)"
        minLabel={`S_min = ${S_MIN}`}
        bCrit={bCrit}
        yourB={yourB}
      />
      <div className="mt-2">
        <CurvePlot
          f={(b) => examplesToTarget(b, bCrit)}
          label="examples burned · E(B) = B · S(B)"
          minLabel={`E_min = ${S_MIN} · B_crit`}
          bCrit={bCrit}
          yourB={yourB}
        />
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-2">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              your B <span className="text-ink-faint">· what you train with</span>
            </span>
            <span className="text-ink">{yourB}</span>
          </span>
          <input
            type="range"
            min={0}
            max={12}
            step={1}
            value={yourExp}
            onChange={(e) => setYourExp(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              B_crit <span className="text-ink-faint">· the task's noise scale</span>
            </span>
            <span className="text-ink">{bCrit}</span>
          </span>
          <input
            type="range"
            min={4}
            max={10}
            step={1}
            value={critExp}
            onChange={(e) => setCritExp(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
      </div>

      <dl className="mt-4 grid gap-x-8 gap-y-2 border-paper-edge border-t pt-4 font-mono text-xs sm:grid-cols-2">
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">wall-clock cost · steps</dt>
          <dd className="text-ink tabular-nums">
            {Math.round(stepsToTarget(yourB, bCrit)).toLocaleString()} (
            {(stepsToTarget(yourB, bCrit) / S_MIN).toFixed(2)}× the floor)
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-ink-faint">compute cost · examples</dt>
          <dd className="text-ink tabular-nums">
            {Math.round(examplesToTarget(yourB, bCrit)).toLocaleString()} (
            {(examplesToTarget(yourB, bCrit) / (S_MIN * bCrit)).toFixed(2)}× the floor)
          </dd>
        </div>
      </dl>
      <p className={cn('mt-3 font-mono text-xs', TONE_CLASS[verdict.tone])}>▸ {verdict.label}</p>
    </div>
  )
}
