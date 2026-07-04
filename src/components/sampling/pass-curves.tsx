import { useState } from 'react'
import { fmtPct, passAtK } from '@/components/sampling/model'

const W = 560
const H = 230
const PAD = { l: 44, r: 76, t: 14, b: 30 }
const T_MIN = 0.1
const T_MAX = 2

const px = (t: number) => PAD.l + ((t - T_MIN) / (T_MAX - T_MIN)) * (W - PAD.l - PAD.r)
const py = (v: number) => H - PAD.b - v * (H - PAD.t - PAD.b)

const curve = (k: number) => {
  const pts: string[] = []
  for (let t = T_MIN; t <= T_MAX + 1e-9; t += 0.02) {
    pts.push(`${px(t).toFixed(1)},${py(passAtK(t, k)).toFixed(1)}`)
  }
  return pts.join(' ')
}

const PASS1 = curve(1)
const PASS8 = curve(8)

/** §3 — the same model scores differently depending on how you decode it. */
export function PassCurves() {
  const [temp, setTemp] = useState(0.7)

  const p1 = passAtK(temp, 1)
  const p8 = passAtK(temp, 8)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-[420px]"
          role="img"
          aria-label="pass@1 and pass@8 versus temperature"
        >
          {[0, 0.25, 0.5, 0.75].map((v) => (
            <g key={v}>
              <line
                x1={PAD.l}
                y1={py(v)}
                x2={W - PAD.r}
                y2={py(v)}
                stroke="var(--color-paper-edge)"
                strokeWidth={1}
              />
              <text
                x={PAD.l - 6}
                y={py(v) + 3}
                textAnchor="end"
                className="fill-ink-faint font-mono text-[9px]"
              >
                {fmtPct(v, 0)}
              </text>
            </g>
          ))}
          {[0.5, 1, 1.5, 2].map((t) => (
            <text
              key={t}
              x={px(t)}
              y={H - PAD.b + 16}
              textAnchor="middle"
              className="fill-ink-faint font-mono text-[9px]"
            >
              T={t}
            </text>
          ))}
          <polyline points={PASS8} fill="none" stroke="var(--color-moss)" strokeWidth={2} />
          <polyline points={PASS1} fill="none" stroke="var(--color-vermillion)" strokeWidth={2} />
          <text
            x={W - PAD.r + 6}
            y={py(passAtK(T_MAX, 8)) + 3}
            className="fill-moss font-mono text-[10px]"
          >
            pass@8
          </text>
          <text
            x={W - PAD.r + 6}
            y={py(passAtK(T_MAX, 1)) + 3}
            className="fill-vermillion font-mono text-[10px]"
          >
            pass@1
          </text>
          <line
            x1={px(temp)}
            y1={PAD.t}
            x2={px(temp)}
            y2={H - PAD.b}
            stroke="var(--color-ink-faint)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
          <circle cx={px(temp)} cy={py(p1)} r={4} fill="var(--color-vermillion)" />
          <circle cx={px(temp)} cy={py(p8)} r={4} fill="var(--color-moss)" />
        </svg>
      </div>

      <div className="mt-4 grid gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-[1fr_auto_auto]">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>T · the temperature you report (or don't)</span>
            <span className="text-ink">{temp.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={T_MIN}
            max={T_MAX}
            step={0.01}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <p className="font-mono text-xs">
          <span className="text-ink-soft">pass@1 </span>
          <span className="text-vermillion tabular-nums">{fmtPct(p1)}</span>
        </p>
        <p className="font-mono text-xs">
          <span className="text-ink-soft">pass@8 </span>
          <span className="text-moss-deep tabular-nums dark:text-moss">{fmtPct(p8)}</span>
        </p>
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          The two curves peak at <strong className="text-ink">different temperatures</strong>: cold
          decoding maximizes one-shot accuracy; heat buys the diversity that pass@8 pays for. Two
          papers "evaluating the same model" at different T and k are measuring different systems —
          which is why decoding params belong next to every number you publish.
        </p>
      </div>
    </div>
  )
}
