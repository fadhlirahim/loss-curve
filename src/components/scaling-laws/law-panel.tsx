import { useState } from 'react'
import {
  chinchillaLoss,
  fmtCount,
  fmtLoss,
  lossTerms,
  sizingVerdict,
} from '@/components/scaling-laws/model'
import { cn } from '@/lib/utils'

const VERDICTS = {
  under: {
    tag: 'data-starved',
    note: "this model stopped learning long before its capacity filled — more tokens (or a smaller model) buy loss for free. This is most models trained before Chinchilla's paper.",
  },
  ridge: {
    tag: 'near the compute-optimal ridge',
    note: 'params and tokens are pulling roughly equal weight — this budget is well spent, by the pretraining-loss yardstick.',
  },
  over: {
    tag: 'past the ridge',
    note: 'at this budget the same FLOPs would buy more loss as extra parameters — unless you care what the model costs to serve. §4 is about why you might stay here on purpose.',
  },
} as const

const TERMS = [
  { key: 'irreducible', label: 'E · irreducible', color: 'var(--color-ink-faint)' },
  { key: 'params', label: 'A/Nᵅ · too few params', color: 'var(--color-vermillion)' },
  { key: 'data', label: 'B/Dᵝ · too few tokens', color: 'var(--color-moss)' },
] as const

/** §1 — the law as two sliders: pick N and D, read the loss and who's to blame. */
export function LawPanel() {
  const [logN, setLogN] = useState(9)
  const [logD, setLogD] = useState(10.3)

  const n = 10 ** logN
  const d = 10 ** logD
  const loss = chinchillaLoss(n, d)
  const terms = lossTerms(n, d)
  const verdict = VERDICTS[sizingVerdict(n, d)]

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              N <span className="text-ink-faint">· parameters</span>
            </span>
            <span className="text-ink">{fmtCount(n)}</span>
          </span>
          <input
            type="range"
            min={6}
            max={11}
            step={0.02}
            value={logN}
            onChange={(e) => setLogN(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              D <span className="text-ink-faint">· training tokens</span>
            </span>
            <span className="text-ink">{fmtCount(d)}</span>
          </span>
          <input
            type="range"
            min={8}
            max={13}
            step={0.02}
            value={logD}
            onChange={(e) => setLogD(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
      </div>

      {/* headline readouts */}
      <div className="mt-6 flex flex-wrap gap-x-10 gap-y-3 border-paper-edge border-t pt-5 font-mono text-xs">
        <div>
          <p className="text-[0.65rem] text-ink-faint uppercase tracking-widest">predicted loss</p>
          <p className="mt-1 text-2xl text-ink tabular-nums">{fmtLoss(loss)}</p>
        </div>
        <div>
          <p className="text-[0.65rem] text-ink-faint uppercase tracking-widest">tokens / param</p>
          <p className="mt-1 text-2xl text-ink tabular-nums">{(d / n).toFixed(1)}</p>
        </div>
      </div>

      {/* who is holding you back */}
      <div className="mt-5">
        <div className="flex h-8 gap-[2px]">
          {TERMS.map((t) => (
            <div
              key={t.key}
              className="min-w-[2px]"
              style={{ flexGrow: terms[t.key], background: t.color }}
              title={`${t.label} = ${fmtLoss(terms[t.key])}`}
            />
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-[0.68rem] text-ink-soft">
          {TERMS.map((t) => (
            <span key={t.key} className="flex items-center gap-1.5">
              <span className="inline-block h-2 w-2" style={{ background: t.color }} />
              {t.label} = <span className="text-ink tabular-nums">{fmtLoss(terms[t.key])}</span>
            </span>
          ))}
        </div>
      </div>

      {/* verdict */}
      <div
        className={cn(
          'mt-5 border-l-2 bg-paper-bright px-4 py-3',
          verdict === VERDICTS.ridge ? 'border-moss' : 'border-vermillion',
        )}
      >
        <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
          {verdict.tag}
        </p>
        <p className="mt-1.5 max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          {verdict.note}
        </p>
      </div>
    </div>
  )
}
