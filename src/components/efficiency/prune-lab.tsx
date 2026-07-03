import { useState } from 'react'
import {
  GRID_COLS,
  N_WEIGHTS,
  type Pruned,
  prune24,
  pruneCurve,
  pruneMagnitude,
  rmse,
  tensor,
} from '@/components/efficiency/model'
import { Chips } from '@/components/lab/chips'

const W = 320
const H = 190
const PAD = { top: 12, right: 10, bottom: 26, left: 40 }

const HATCH =
  'repeating-linear-gradient(45deg, var(--color-paper-deep) 0 2px, var(--color-paper) 2px 4px)'

const BASE = tensor(false)
const CURVE = pruneCurve(BASE)
const LIM = Math.max(...BASE.map(Math.abs))
const P24 = prune24(BASE)
const RMSE_24 = rmse(BASE, P24.w)
const RMSE_UN_50 = rmse(BASE, pruneMagnitude(BASE, 0.5).w)

function SparsityPlot({ sparsity, mode }: { sparsity: number; mode: 'unstructured' | '24' }) {
  const maxR = CURVE[CURVE.length - 1].rmse
  const x = (s: number) => PAD.left + (s / 0.95) * (W - PAD.left - PAD.right)
  const y = (v: number) => PAD.top + (1 - v / maxR) * (H - PAD.top - PAD.bottom)
  const path = CURVE.map(
    (p, i) => `${i === 0 ? 'M' : 'L'}${x(p.s).toFixed(1)},${y(p.rmse).toFixed(1)}`,
  ).join(' ')
  const current =
    mode === '24'
      ? { s: 0.5, r: RMSE_24 }
      : { s: sparsity, r: CURVE[Math.round(sparsity / 0.05)].rmse }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Error vs sparsity">
      {[0, 0.25, 0.5, 0.75].map((s) => (
        <text
          key={s}
          x={x(s)}
          y={H - 8}
          textAnchor="middle"
          fontSize={9}
          fontFamily="var(--font-mono)"
          fill="var(--color-ink-faint)"
        >
          {Math.round(s * 100)}%
        </text>
      ))}
      <text
        x={12}
        y={PAD.top + 4}
        fontSize={9}
        fontFamily="var(--font-mono)"
        fill="var(--color-ink-faint)"
      >
        rmse
      </text>
      <path d={path} fill="none" stroke="var(--color-moss)" strokeWidth={2} />
      {mode === '24' && (
        <circle
          cx={x(0.5)}
          cy={y(RMSE_UN_50)}
          r={3.5}
          fill="var(--color-moss)"
          stroke="var(--color-paper-bright)"
          strokeWidth={1.5}
        />
      )}
      <circle
        cx={x(current.s)}
        cy={y(current.r)}
        r={4.5}
        fill="var(--color-vermillion)"
        stroke="var(--color-paper-bright)"
        strokeWidth={2}
      />
    </svg>
  )
}

function PrunedGrid({ pruned }: { pruned: Pruned }) {
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)` }}>
      {pruned.w.map((v, i) => (
        <span
          key={`cell-${
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed tensor; position is the identity
            i
          }`}
          title={pruned.mask[i] ? 'pruned' : v.toFixed(3)}
          className="block aspect-square"
          style={{
            background: pruned.mask[i]
              ? HATCH
              : `color-mix(in oklab, ${
                  v < 0 ? 'var(--color-vermillion-deep)' : 'var(--color-moss)'
                } ${Math.round((Math.abs(v) / LIM) * 100)}%, var(--color-paper-bright))`,
          }}
        />
      ))}
    </div>
  )
}

/**
 * §3 — magnitude pruning on the same tensor: free-form vs the 2:4 pattern
 * hardware actually accelerates.
 */
export function PruneLab() {
  const [mode, setMode] = useState<'unstructured' | '24'>('unstructured')
  const [sparsity, setSparsity] = useState(0.5)

  const pruned = mode === '24' ? P24 : pruneMagnitude(BASE, sparsity)
  const effSparsity = mode === '24' ? 0.5 : sparsity
  const err = mode === '24' ? RMSE_24 : rmse(BASE, pruned.w)
  const kept = N_WEIGHTS - pruned.mask.filter(Boolean).length

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <Chips
          label="pattern"
          options={[
            { id: 'unstructured', label: 'unstructured' },
            { id: '24', label: '2:4 semi-structured' },
          ]}
          value={mode}
          onPick={(id) => setMode(id as 'unstructured' | '24')}
        />
        <label className="block w-48 font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>sparsity</span>
            <span className="text-ink">{Math.round(effSparsity * 100)}%</span>
          </span>
          <input
            type="range"
            min={0}
            max={0.95}
            step={0.05}
            value={effSparsity}
            disabled={mode === '24'}
            onChange={(e) => setSparsity(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion disabled:opacity-40"
          />
          {mode === '24' && (
            <span className="mt-1 block text-[0.65rem] text-ink-faint">
              pinned — 2 of every 4 is exactly 50%
            </span>
          )}
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
            surviving weights ({kept}/{N_WEIGHTS}) · rmse{' '}
            <span className="text-ink normal-case tabular-nums">{err.toFixed(4)}</span>
          </p>
          <div className="mt-1.5">
            <PrunedGrid pruned={pruned} />
          </div>
        </div>
        <div>
          <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
            reconstruction error vs sparsity
          </p>
          <SparsityPlot sparsity={sparsity} mode={mode} />
          {mode === '24' && (
            <p className="mt-1 font-mono text-[0.7rem] text-ink-faint">
              2:4 at 50%: <span className="text-vermillion tabular-nums">{RMSE_24.toFixed(4)}</span>{' '}
              · unstructured at 50%:{' '}
              <span className="text-moss-deep tabular-nums dark:text-moss">
                {RMSE_UN_50.toFixed(4)}
              </span>{' '}
              — the constraint costs a little accuracy
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          {mode === 'unstructured' ? (
            <>
              Free-form pruning keeps the globally largest weights — gentle at first, a cliff past
              ~80%. The catch: scattered zeros{' '}
              <strong className="text-ink">save memory, not time</strong>. A dense matmul kernel
              multiplies the zeros anyway.
            </>
          ) : (
            <>
              2:4 exists because NVIDIA tensor cores accelerate{' '}
              <strong className="text-ink">exactly this shape</strong>: two survivors per block of
              four, so the hardware can skip the zeros by construction. You pay a small accuracy tax
              for a real 2× compute win — the whole sparsity story in one trade.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
