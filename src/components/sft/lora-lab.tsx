import { useState } from 'react'
import { pct } from '@/components/attention/model'
import {
  D,
  DELTA_W,
  ENERGY_CURVE,
  energyAt,
  FULL_PARAMS,
  loraParams,
  MAX_ABS,
  rankApprox,
} from '@/components/sft/model'

const W = 460
const H = 170
const PAD = { l: 40, r: 14, t: 12, b: 26 }

const px = (r: number) => PAD.l + ((r - 1) / (D - 1)) * (W - PAD.l - PAD.r)
const py = (e: number) => H - PAD.b - e * (H - PAD.t - PAD.b)

function SignedGrid({ matrix, label }: { matrix: number[][]; label: string }) {
  return (
    <div>
      <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">{label}</p>
      <div
        className="mt-2 grid grid-cols-16 gap-px"
        style={{ gridTemplateColumns: `repeat(${D}, 1fr)` }}
      >
        {matrix.flatMap((row, i) =>
          row.map((v, j) => (
            <span
              key={`${label}-${
                // biome-ignore lint/suspicious/noArrayIndexKey: static matrix; position is the identity
                i * D + j
              }`}
              className="block aspect-square"
              style={{
                background: `color-mix(in oklab, ${
                  v >= 0 ? 'var(--color-vermillion-deep)' : 'var(--color-moss-deep)'
                } ${Math.round((Math.abs(v) / MAX_ABS) * 100)}%, var(--color-paper-bright))`,
              }}
            />
          )),
        )}
      </div>
    </div>
  )
}

/**
 * §2 — the fine-tune update ΔW and its best rank-r approximation, with the
 * explained-energy curve. Six directions of signal; extra rank buys noise.
 */
export function LoraLab() {
  const [rank, setRank] = useState(2)

  const energy = energyAt(rank)
  const approx = rankApprox(rank)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <label className="block font-mono text-xs">
        <span className="flex justify-between text-ink-soft">
          <span>r · adapter rank</span>
          <span className="text-ink">{rank}</span>
        </span>
        <input
          type="range"
          min={1}
          max={D}
          step={1}
          value={rank}
          onChange={(e) => setRank(Number(e.target.value))}
          className="mt-1 w-full accent-vermillion"
        />
      </label>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="explained energy versus adapter rank"
          >
            <line
              x1={PAD.l}
              y1={py(1)}
              x2={W - PAD.r}
              y2={py(1)}
              stroke="var(--color-paper-edge)"
              strokeDasharray="3 4"
            />
            <line
              x1={px(6)}
              y1={PAD.t}
              x2={px(6)}
              y2={H - PAD.b}
              stroke="var(--color-gold)"
              strokeDasharray="3 4"
            />
            <line
              x1={PAD.l}
              y1={H - PAD.b}
              x2={W - PAD.r}
              y2={H - PAD.b}
              stroke="var(--color-paper-edge)"
            />
            <polyline
              points={ENERGY_CURVE.map((e, i) => `${px(i + 1)},${py(e)}`).join(' ')}
              fill="none"
              stroke="var(--color-moss)"
              strokeWidth={2}
            />
            <circle cx={px(rank)} cy={py(energy)} r={4.5} fill="var(--color-vermillion)" />
            <text x={px(6) + 4} y={PAD.t + 10} className="fill-ink-faint font-mono text-[9px]">
              6 directions of signal
            </text>
            <text
              x={PAD.l - 6}
              y={py(1) + 3}
              textAnchor="end"
              className="fill-ink-faint font-mono text-[9px]"
            >
              100%
            </text>
            <text
              x={px(1)}
              y={H - 8}
              textAnchor="middle"
              className="fill-ink-faint font-mono text-[9px]"
            >
              r=1
            </text>
            <text
              x={px(D)}
              y={H - 8}
              textAnchor="middle"
              className="fill-ink-faint font-mono text-[9px]"
            >
              r={D}
            </text>
          </svg>
          <div className="mt-2 space-y-1 font-mono text-[0.72rem] text-ink-soft">
            <p>
              rank {rank} explains <span className="text-vermillion">{pct(energy)}</span> of the
              update
            </p>
            <p>
              params: {loraParams(rank)} vs {FULL_PARAMS} full ·{' '}
              <span className="text-ink">{pct(loraParams(rank) / FULL_PARAMS)}</span> of a full
              fine-tune
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <SignedGrid matrix={DELTA_W} label="ΔW · full update" />
          <SignedGrid matrix={approx} label={`rank-${rank} approx`} />
        </div>
      </div>
    </div>
  )
}
