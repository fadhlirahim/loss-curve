import { useState } from 'react'
import {
  BITS_RANGE,
  effectiveBits,
  GRID_COLS,
  gbAt1B,
  histogram,
  N_WEIGHTS,
  OUTLIER_INDEX,
  quantize,
  quantLevels,
  rmse,
  rmseCurve,
  rmseOutsideOutlierGroup,
  tensor,
} from '@/components/efficiency/model'
import { Chips } from '@/components/lab/chips'
import { cn } from '@/lib/utils'

const W = 320
const H = 190
const PAD = { top: 12, right: 10, bottom: 26, left: 40 }

function HistPlot({ w, bits, showGrid }: { w: number[]; bits: number; showGrid: boolean }) {
  const bins = histogram(w, 41)
  const maxCount = Math.max(...bins.map((b) => b.count))
  const lim = Math.max(Math.abs(bins[0].x0), bins[bins.length - 1].x1)
  const x = (v: number) => PAD.left + ((v + lim) / (2 * lim)) * (W - PAD.left - PAD.right)
  const y = (c: number) => PAD.top + (1 - c / maxCount) * (H - PAD.top - PAD.bottom)
  const levels = showGrid && bits <= 6 ? quantLevels(w, bits) : []

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Weight histogram">
      {bins.map((b) => (
        <rect
          key={b.x0}
          x={x(b.x0)}
          y={y(b.count)}
          width={Math.max(1, x(b.x1) - x(b.x0) - 0.6)}
          height={H - PAD.bottom - y(b.count)}
          fill="var(--color-ink-faint)"
          opacity={0.55}
        />
      ))}
      {levels.map((v) => (
        <line
          key={v}
          x1={x(v)}
          x2={x(v)}
          y1={PAD.top}
          y2={H - PAD.bottom}
          stroke="var(--color-vermillion)"
          strokeDasharray="2 3"
          opacity={0.7}
        />
      ))}
      <line
        x1={PAD.left}
        x2={W - PAD.right}
        y1={H - PAD.bottom}
        y2={H - PAD.bottom}
        stroke="var(--color-paper-edge)"
      />
      <text
        x={W - PAD.right}
        y={H - 8}
        textAnchor="end"
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill="var(--color-ink-faint)"
      >
        {showGrid && bits > 6
          ? 'grid finer than the histogram — not drawn'
          : showGrid
            ? 'vermillion lines = every value this grid can store'
            : 'each group has its own grid — that is the point'}
      </text>
    </svg>
  )
}

function RmsePlot({
  groupSize,
  outlier,
  bits,
}: {
  groupSize: number
  outlier: boolean
  bits: number
}) {
  const clean = rmseCurve(groupSize, false)
  const dirty = outlier ? rmseCurve(groupSize, true) : null
  const all = [...clean, ...(dirty ?? [])].map((p) => p.rmse)
  const logMin = Math.log10(Math.min(...all))
  const logMax = Math.log10(Math.max(...all))
  const x = (b: number) => PAD.left + ((b - 2) / 6) * (W - PAD.left - PAD.right)
  const y = (v: number) =>
    PAD.top + (1 - (Math.log10(v) - logMin) / (logMax - logMin)) * (H - PAD.top - PAD.bottom)
  const path = (pts: { bits: number; rmse: number }[]) =>
    pts
      .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.bits).toFixed(1)},${y(p.rmse).toFixed(1)}`)
      .join(' ')
  const active = (dirty ?? clean).find((p) => p.bits === bits)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="RMSE vs bits">
      {BITS_RANGE.map((b) => (
        <text
          key={b}
          x={x(b)}
          y={H - 8}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill={b === bits ? 'var(--color-ink)' : 'var(--color-ink-faint)'}
        >
          {b}
        </text>
      ))}
      <text
        x={12}
        y={PAD.top + 4}
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill="var(--color-ink-faint)"
      >
        rmse (log)
      </text>
      <path d={path(clean)} fill="none" stroke="var(--color-moss)" strokeWidth={2} />
      {dirty && (
        <path d={path(dirty)} fill="none" stroke="var(--color-vermillion)" strokeWidth={2} />
      )}
      {active && (
        <circle
          cx={x(active.bits)}
          cy={y(active.rmse)}
          r={4}
          fill={dirty ? 'var(--color-vermillion)' : 'var(--color-moss)'}
          stroke="var(--color-paper-bright)"
          strokeWidth={2}
        />
      )}
      <text
        x={W - PAD.right}
        y={PAD.top + 4}
        textAnchor="end"
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill="var(--color-ink-faint)"
      >
        {dirty ? 'moss = clean · vermillion = with outlier' : 'clean tensor'}
      </text>
    </svg>
  )
}

function WeightGrid({ w, label, outlierAt }: { w: number[]; label: string; outlierAt?: number }) {
  const lim = Math.max(...w.map(Math.abs))
  return (
    <div>
      <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">{label}</p>
      <div
        className="mt-1.5 grid gap-px"
        style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}
      >
        {w.map((v, i) => (
          <span
            key={`${label}-${
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed tensor; position is the identity
              i
            }`}
            title={v.toFixed(3)}
            className={cn(
              'block aspect-square',
              i === outlierAt && 'outline outline-1 outline-ink',
            )}
            style={{
              background: `color-mix(in oklab, ${
                v < 0 ? 'var(--color-vermillion-deep)' : 'var(--color-moss)'
              } ${Math.round((Math.abs(v) / lim) * 100)}%, var(--color-paper-bright))`,
            }}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * §1 — absmax uniform quantization on a real tensor: bits, granularity,
 * and the outlier that makes per-group scaling exist.
 */
export function QuantLab() {
  const [bits, setBits] = useState(4)
  const [mode, setMode] = useState<'tensor' | 'group'>('tensor')
  const [groupSize, setGroupSize] = useState(16)
  const [outlier, setOutlier] = useState(false)

  const g = mode === 'tensor' ? N_WEIGHTS : groupSize
  const w = tensor(outlier)
  const wq = quantize(w, bits, g)
  const err = rmse(w, wq)
  const effBits = effectiveBits(bits, g)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* controls */}
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <label className="block w-40 font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>bits</span>
            <span className="text-ink">{bits}</span>
          </span>
          <input
            type="range"
            min={2}
            max={8}
            step={1}
            value={bits}
            onChange={(e) => setBits(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <Chips
          label="scale granularity"
          options={[
            { id: 'tensor', label: 'per-tensor' },
            { id: 'group', label: 'per-group' },
          ]}
          value={mode}
          onPick={(id) => setMode(id as 'tensor' | 'group')}
        />
        {mode === 'group' && (
          <Chips
            label="group size"
            options={[16, 32, 64].map((s) => ({ id: String(s), label: String(s) }))}
            value={String(groupSize)}
            onPick={(id) => setGroupSize(Number(id))}
          />
        )}
        <label className="flex cursor-pointer items-center gap-2 font-mono text-ink-soft text-xs">
          <input
            type="checkbox"
            checked={outlier}
            onChange={(e) => setOutlier(e.target.checked)}
            className="accent-vermillion"
          />
          inject one 8× outlier
        </label>
      </div>

      {/* plots */}
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
            weight distribution + storable values
          </p>
          <HistPlot w={w} bits={bits} showGrid={mode === 'tensor'} />
        </div>
        <div>
          <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
            reconstruction error vs bits
          </p>
          <RmsePlot groupSize={g} outlier={outlier} bits={bits} />
        </div>
      </div>

      {/* grids */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <WeightGrid
          w={w}
          label="original weights"
          outlierAt={outlier ? OUTLIER_INDEX : undefined}
        />
        <WeightGrid w={wq} label={`stored at ${bits} bits`} />
      </div>

      {/* readouts */}
      <dl className="mt-6 grid grid-cols-3 gap-4 border-paper-edge border-t pt-4 font-mono text-xs">
        <div>
          <dt className="text-ink-faint">rmse</dt>
          <dd className="mt-0.5 text-ink tabular-nums">{err.toFixed(4)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">bits/weight (incl. scales)</dt>
          <dd className="mt-0.5 text-ink tabular-nums">{effBits.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-ink-faint">1B model</dt>
          <dd className="mt-0.5 text-ink tabular-nums">{gbAt1B(effBits).toFixed(2)} GB</dd>
        </div>
      </dl>

      {/* ticker */}
      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          {!outlier && (
            <>
              The whole trick: <strong className="text-ink">scale = absmax ÷ levels</strong>. Every
              weight snaps to the nearest of {2 ** (bits - 1) - 1} steps per sign. More bits, finer
              steps, lower error — smoothly.
            </>
          )}
          {outlier && mode === 'tensor' && (
            <>
              One weight (outlined, 8× the max) now{' '}
              <strong className="text-ink">owns the range</strong>: the scale stretched to fit it,
              the other 255 weights collapsed into a few coarse steps, and RMSE jumped ~7×. One
              number ruined the whole tensor.
            </>
          )}
          {outlier && mode === 'group' && (
            <>
              Same outlier, but the damage is{' '}
              <strong className="text-ink">confined to its group of {groupSize}</strong> — outside
              that group the error is unchanged (
              {rmseOutsideOutlierGroup(bits, groupSize).toFixed(4)} vs clean). This containment is
              the entire reason per-group scaling exists.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
