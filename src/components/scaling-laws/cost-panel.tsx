import { useState } from 'react'
import { Chips } from '@/components/lab/chips'
import {
  flopsFor,
  fmtFlops,
  fmtHours,
  fmtMoney,
  GPUS,
  PRESETS,
  wallHours,
} from '@/components/scaling-laws/model'

/** §3 — the calculator: turn the §2 budget into GPU-hours and dollars. */
export function CostPanel({ logC, setLogC }: { logC: number; setLogC: (v: number) => void }) {
  const [gpuId, setGpuId] = useState('h100x8')
  const [mfu, setMfu] = useState(0.4)
  const [rates, setRates] = useState<Record<string, number>>(
    Object.fromEntries(GPUS.map((g) => [g.id, g.defaultRate])),
  )

  const gpu = GPUS.find((g) => g.id === gpuId) ?? GPUS[0]
  const c = 10 ** logC
  const hours = wallHours(c, gpu.flops, mfu)
  const rate = rates[gpu.id]

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <Chips
          label="hardware"
          options={GPUS.map((g) => ({ id: g.id, label: g.label }))}
          value={gpuId}
          onPick={setGpuId}
        />
        <label className="block min-w-40 flex-1 font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              MFU <span className="text-ink-faint">· fraction of peak you actually get</span>
            </span>
            <span className="text-ink">{Math.round(mfu * 100)}%</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={0.6}
            step={0.05}
            value={mfu}
            onChange={(e) => setMfu(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="text-ink-soft">$/hour</span>
          <input
            type="number"
            min={0}
            step={0.1}
            value={rate}
            onChange={(e) => setRates({ ...rates, [gpu.id]: Number(e.target.value) })}
            className="mt-1 w-24 border border-paper-edge bg-paper-bright px-2 py-1.5 text-ink tabular-nums"
          />
        </label>
      </div>

      <dl className="mt-6 max-w-md space-y-2 border border-paper-edge bg-paper-bright p-4 font-mono text-xs">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">budget (set in §2)</dt>
          <dd className="text-ink tabular-nums">{fmtFlops(c)} FLOPs</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">
            {gpu.label} <span className="text-ink-faint">· {gpu.note}</span>
          </dt>
          <dd className="text-ink tabular-nums">×{Math.round(mfu * 100)}% MFU</dd>
        </div>
        <div className="flex justify-between gap-4 border-paper-edge border-t pt-2">
          <dt className="text-ink-soft">wall-clock</dt>
          <dd className="text-ink tabular-nums">{fmtHours(hours)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-soft">ballpark cost</dt>
          <dd className="text-vermillion tabular-nums">{fmtMoney(hours * rate)}</dd>
        </div>
      </dl>

      <div className="mt-6 border-paper-edge border-t pt-5">
        <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
          load a real budget
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {PRESETS.map((p) => (
            <div key={p.id} className="flex flex-col border border-paper-edge bg-paper-deep/30 p-4">
              <h4 className="font-display font-semibold text-sm">{p.label}</h4>
              <p className="mt-1.5 flex-1 text-[0.85rem] text-ink-soft leading-relaxed">
                {p.story}
              </p>
              <button
                type="button"
                onClick={() => setLogC(Math.log10(flopsFor(p.n, p.d)))}
                className="mt-3 self-start bg-ink px-3 py-1.5 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
              >
                load · {fmtFlops(flopsFor(p.n, p.d))} ▸
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
