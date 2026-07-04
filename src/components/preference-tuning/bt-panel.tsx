import { useState } from 'react'
import { fmt2 } from '@/components/attention/model'
import { PREF_PAIR, sigmoid } from '@/components/preference-tuning/model'

const W = 520
const H = 170
const PAD = 28
const X_MAX = 6

const px = (x: number) => PAD + ((x + X_MAX) / (2 * X_MAX)) * (W - 2 * PAD)
const py = (p: number) => H - PAD - p * (H - 2 * PAD)

const CURVE = Array.from({ length: 97 }, (_, i) => {
  const x = -X_MAX + (i / 96) * 2 * X_MAX
  return `${px(x).toFixed(1)},${py(sigmoid(x)).toFixed(1)}`
}).join(' ')

/** §1 — Bradley–Terry: a reward gap becomes a preference probability. */
export function BtPanel() {
  const [gap, setGap] = useState(1.5)

  const p = sigmoid(gap)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
        prompt · {PREF_PAIR.prompt}
      </p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div className="border border-moss/50 bg-paper-bright p-4">
          <p className="font-mono text-[0.65rem] text-moss uppercase tracking-widest">
            chosen · reward r<sub>w</sub>
          </p>
          <p className="mt-2 text-[0.9rem] text-ink-soft leading-relaxed">{PREF_PAIR.chosen}</p>
        </div>
        <div className="border border-paper-edge bg-paper-bright p-4">
          <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
            rejected · reward r<sub>l</sub>
          </p>
          <p className="mt-2 text-[0.9rem] text-ink-soft leading-relaxed">{PREF_PAIR.rejected}</p>
        </div>
      </div>

      <div className="mt-6 grid items-center gap-6 lg:grid-cols-[1fr_16rem]">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          role="img"
          aria-label="Sigmoid of the reward gap"
        >
          <line
            x1={PAD}
            y1={py(0.5)}
            x2={W - PAD}
            y2={py(0.5)}
            stroke="var(--color-paper-edge)"
            strokeDasharray="4 4"
          />
          <line x1={px(0)} y1={py(0)} x2={px(0)} y2={py(1)} stroke="var(--color-paper-edge)" />
          <polyline points={CURVE} fill="none" stroke="var(--color-vermillion)" strokeWidth="2" />
          <circle cx={px(gap)} cy={py(p)} r="5" fill="var(--color-ink)" />
          <text x={PAD} y={py(0.5) - 6} className="fill-ink-faint font-mono" fontSize="9">
            50% — no idea which is better
          </text>
          <text
            x={W - PAD}
            y={H - 8}
            textAnchor="end"
            className="fill-ink-faint font-mono"
            fontSize="9"
          >
            reward gap r_w − r_l
          </text>
        </svg>
        <div>
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>reward gap</span>
              <span className="text-ink">{fmt2(gap)}</span>
            </span>
            <input
              type="range"
              min={-6}
              max={6}
              step={0.1}
              value={gap}
              onChange={(e) => setGap(Number(e.target.value))}
              className="mt-1 w-full accent-vermillion"
            />
          </label>
          <p className="mt-4 font-mono text-ink-soft text-xs">
            P(chosen ≻ rejected) = σ(gap) ={' '}
            <strong className="text-sm text-vermillion">{(p * 100).toFixed(1)}%</strong>
          </p>
        </div>
      </div>

      <div className="mt-5 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          This one function is the load-bearing assumption under all of RLHF: labelers only say{' '}
          <em>which</em> answer is better, and Bradley–Terry turns those comparisons into a scale. A
          reward model is just a machine trained to produce these gaps — and everything downstream
          inherits whatever it gets wrong.
        </p>
      </div>
    </div>
  )
}
