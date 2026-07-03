import { useState } from 'react'
import {
  configFromParams,
  fmtBytes,
  fmtParams,
  GPUS,
  INFER_PRECISIONS,
  inferMemory,
  TRAIN_BYTES_PER_PARAM,
  trainMemory,
} from '@/components/gpu-systems/model'
import { Chips } from '@/components/lab/chips'

const SEGMENT_COLORS = [
  'var(--color-vermillion)',
  'color-mix(in oklab, var(--color-vermillion) 55%, var(--color-paper-bright))',
  'var(--color-gold)',
  'var(--color-moss)',
  'color-mix(in oklab, var(--color-moss) 55%, var(--color-paper-bright))',
  'color-mix(in oklab, var(--color-ink) 25%, var(--color-paper-bright))',
]

export function MemoryAnatomy() {
  const [exp, setExp] = useState(Math.log10(7e9))
  const [mode, setMode] = useState('training')
  const [precision, setPrecision] = useState('bf16')
  const [batch, setBatch] = useState(1)
  const [seqExp, setSeqExp] = useState(11)

  const n = 10 ** exp
  const seq = 2 ** seqExp
  const training = mode === 'training'
  const bpp = INFER_PRECISIONS.find((p) => p.id === precision)?.bytesPerParam ?? 2

  const segments = training
    ? trainMemory(n, batch, seq).segments
    : [{ key: `weights · ${precision}`, bytes: inferMemory(n, bpp) }]
  const total = segments.reduce((s, x) => s + x.bytes, 0)
  const scaleMax = Math.max(total * 1.12, 96e9)
  const statesOnly = training ? TRAIN_BYTES_PER_PARAM * n : total
  const { d, layers } = configFromParams(n)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* controls */}
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>model size</span>
            <span className="text-ink">
              {fmtParams(n)} params · d={d}, {layers} layers
            </span>
          </span>
          <input
            type="range"
            min={8}
            max={10.85}
            step={0.05}
            value={exp}
            onChange={(e) => setExp(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <Chips
          label="mode"
          options={[
            { id: 'training', label: 'training (AdamW, bf16 mixed)' },
            { id: 'inference', label: 'inference' },
          ]}
          value={mode}
          onPick={setMode}
        />
        {training ? (
          <>
            <label className="block font-mono text-xs">
              <span className="flex justify-between text-ink-soft">
                <span>batch size B</span>
                <span className="text-ink">{batch}</span>
              </span>
              <input
                type="range"
                min={1}
                max={64}
                step={1}
                value={batch}
                onChange={(e) => setBatch(Number(e.target.value))}
                className="mt-1 w-full accent-vermillion"
              />
            </label>
            <label className="block font-mono text-xs">
              <span className="flex justify-between text-ink-soft">
                <span>sequence length T</span>
                <span className="text-ink">{seq.toLocaleString()}</span>
              </span>
              <input
                type="range"
                min={9}
                max={13}
                step={1}
                value={seqExp}
                onChange={(e) => setSeqExp(Number(e.target.value))}
                className="mt-1 w-full accent-vermillion"
              />
            </label>
          </>
        ) : (
          <Chips
            label="precision"
            options={INFER_PRECISIONS.map((p) => ({ id: p.id, label: p.label }))}
            value={precision}
            onPick={setPrecision}
          />
        )}
      </div>

      {/* the bar */}
      <div className="relative mt-6">
        <div className="flex h-12 gap-[2px]">
          {segments.map((s, i) => (
            <div
              key={s.key}
              title={`${s.key} · ${fmtBytes(s.bytes)}`}
              className="min-w-[2px]"
              style={{
                flexGrow: s.bytes,
                background: SEGMENT_COLORS[training ? i : 0],
              }}
            />
          ))}
          <div style={{ flexGrow: Math.max(0, scaleMax - total) }} />
        </div>
        {GPUS.map((g) => (
          <div
            key={g.name}
            className="absolute inset-y-[-6px] border-ink border-l border-dashed"
            style={{ left: `${(g.gb * 1e9 * 100) / scaleMax}%` }}
          >
            <span className="absolute top-[-14px] left-1 whitespace-nowrap font-mono text-[0.58rem] text-ink-faint">
              {g.name}
            </span>
          </div>
        ))}
      </div>

      {/* legend */}
      <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5">
        {segments.map((s, i) => (
          <span
            key={s.key}
            className="flex items-center gap-1.5 font-mono text-[0.68rem] text-ink-soft"
          >
            <span
              className="inline-block h-2.5 w-2.5"
              style={{ background: SEGMENT_COLORS[training ? i : 0] }}
            />
            {s.key} · <span className="text-ink tabular-nums">{fmtBytes(s.bytes)}</span>
          </span>
        ))}
      </div>

      {/* verdict */}
      <div className="mt-5 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="font-mono text-[0.8rem] text-ink">
          total: <strong>{fmtBytes(total)}</strong> — <Verdict total={total} />
        </p>
        {training && (
          <p className="mt-1.5 max-w-2xl text-[0.88rem] text-ink-soft leading-relaxed">
            The states alone are {fmtBytes(statesOnly)} — {TRAIN_BYTES_PER_PARAM} bytes riding on
            every parameter, ~8× what bf16 inference needs.{' '}
            <strong className="text-ink">The optimizer, not the model, is the tenant.</strong>
          </p>
        )}
      </div>
    </div>
  )
}

function Verdict({ total }: { total: number }) {
  const fit = GPUS.filter((g) => total <= g.gb * 1e9)
  if (fit.length === 0) {
    const count = Math.ceil(total / (80 * 1e9))
    return (
      <span className="text-vermillion">
        OOM on every single card — ~{count}× 80GB worth of memory. This is why ZeRO, offload, and
        recomputation exist.
      </span>
    )
  }
  const smallest = fit[0]
  const spare = smallest.gb * 1e9 - total
  return (
    <span className="text-moss-deep dark:text-moss">
      fits on one {smallest.name} with {fmtBytes(spare)} to spare.
    </span>
  )
}
