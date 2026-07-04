import { useState } from 'react'
import { fmt2 } from '@/components/attention/model'
import { dpo, dpoLossAt } from '@/components/preference-tuning/model'

const W = 520
const H = 190
const PAD = 30
const M_MAX = 6
const LN2 = Math.log(2)

const px = (m: number) => PAD + ((m + M_MAX) / (2 * M_MAX)) * (W - 2 * PAD)

function SignedBar({ value, max }: { value: number; max: number }) {
  const half = 50
  const w = Math.min(half, (Math.abs(value) / max) * half)
  return (
    <span className="relative inline-block h-2.5 w-full max-w-[7rem] bg-paper-deep align-middle">
      <span
        className={value >= 0 ? 'absolute inset-y-0 bg-moss' : 'absolute inset-y-0 bg-vermillion'}
        style={value >= 0 ? { left: '50%', width: `${w}%` } : { right: '50%', width: `${w}%` }}
      />
      <span className="absolute inset-y-0 left-1/2 w-px bg-paper-edge" />
    </span>
  )
}

/** §2 — the DPO loss on one preference pair, every term live. */
export function DpoPanel() {
  const [chosenRatio, setChosenRatio] = useState(1.5)
  const [rejectedRatio, setRejectedRatio] = useState(-0.5)
  const [beta, setBeta] = useState(0.1)

  const d = dpo(chosenRatio, rejectedRatio, beta)
  const yMax = Math.max(1.2, dpoLossAt(-M_MAX, beta) * 1.05)
  const py = (l: number) => H - PAD - (Math.min(l, yMax) / yMax) * (H - 2 * PAD)
  const curve = Array.from({ length: 97 }, (_, i) => {
    const m = -M_MAX + (i / 96) * 2 * M_MAX
    return `${px(m).toFixed(1)},${py(dpoLossAt(m, beta)).toFixed(1)}`
  }).join(' ')

  const sliders = [
    {
      label: 'log-ratio, chosen',
      value: chosenRatio,
      set: setChosenRatio,
      min: -4,
      max: 4,
      step: 0.1,
    },
    {
      label: 'log-ratio, rejected',
      value: rejectedRatio,
      set: setRejectedRatio,
      min: -4,
      max: 4,
      step: 0.1,
    },
    { label: 'β — the leash', value: beta, set: setBeta, min: 0.01, max: 1, step: 0.01 },
  ]

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <div className="space-y-4">
          {sliders.map((s) => (
            <label key={s.label} className="block font-mono text-xs">
              <span className="flex justify-between text-ink-soft">
                <span>{s.label}</span>
                <span className="text-ink">{fmt2(s.value)}</span>
              </span>
              <input
                type="range"
                min={s.min}
                max={s.max}
                step={s.step}
                value={s.value}
                onChange={(e) => s.set(Number(e.target.value))}
                className="mt-1 w-full accent-vermillion"
              />
            </label>
          ))}
          <p className="font-mono text-[0.7rem] text-ink-faint">
            log-ratios are log π(y)/π_ref(y) — how far the policy has moved from the reference on
            each response. reference = 0 by definition.
          </p>
        </div>

        <div>
          <dl className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-2 font-mono text-xs">
            <dt className="text-ink-soft">implicit reward, chosen</dt>
            <SignedBar value={d.rewardChosen} max={4} />
            <dd className="text-right text-ink tabular-nums">{fmt2(d.rewardChosen)}</dd>
            <dt className="text-ink-soft">implicit reward, rejected</dt>
            <SignedBar value={d.rewardRejected} max={4} />
            <dd className="text-right text-ink tabular-nums">{fmt2(d.rewardRejected)}</dd>
            <dt className="text-ink-soft">margin</dt>
            <SignedBar value={d.margin} max={8} />
            <dd className="text-right text-ink tabular-nums">{fmt2(d.margin)}</dd>
            <dt className="text-ink-soft">loss</dt>
            <span />
            <dd className="text-right text-vermillion tabular-nums">{d.loss.toFixed(3)}</dd>
            <dt className="text-ink-soft">gradient weight σ(−β·margin)</dt>
            <span className="relative inline-block h-2.5 w-full max-w-[7rem] bg-paper-deep">
              <span
                className="absolute inset-y-0 left-0 bg-vermillion"
                style={{ width: `${d.gradWeight * 100}%` }}
              />
            </span>
            <dd className="text-right text-ink tabular-nums">{d.gradWeight.toFixed(3)}</dd>
          </dl>

          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="mt-4 w-full"
            role="img"
            aria-label="DPO loss versus margin"
          >
            <line
              x1={PAD}
              y1={py(LN2)}
              x2={W - PAD}
              y2={py(LN2)}
              stroke="var(--color-paper-edge)"
              strokeDasharray="4 4"
            />
            <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(yMax)} stroke="var(--color-paper-edge)" />
            <polyline points={curve} fill="none" stroke="var(--color-vermillion)" strokeWidth="2" />
            <circle cx={px(d.margin)} cy={py(d.loss)} r="5" fill="var(--color-ink)" />
            <text x={PAD} y={py(LN2) - 5} className="fill-ink-faint font-mono" fontSize="9">
              ln 2 — a pair the policy is agnostic about
            </text>
            <text
              x={W - PAD}
              y={H - 8}
              textAnchor="end"
              className="fill-ink-faint font-mono"
              fontSize="9"
            >
              margin (chosen − rejected log-ratio)
            </text>
          </svg>
        </div>
      </div>

      <div className="mt-5 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          Two things to feel here. The gradient weight falls as the margin grows —{' '}
          <strong className="text-ink">
            DPO stops pushing on pairs it already ranks correctly
          </strong>{' '}
          and spends its gradient where it's still wrong. And β sets the leash: drag it down and the
          loss curve flattens — the policy can drift far from the reference before the loss cares;
          crank it up and tiny drifts saturate the loss immediately.
        </p>
      </div>
    </div>
  )
}
