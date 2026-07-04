import { useState } from 'react'
import {
  BENCH,
  CONTAMINATION,
  contaminationReport,
  DEFAULT_CONTAM_THRESHOLD,
} from '@/components/evals/model'
import { cn } from '@/lib/utils'

/** §3 — a real n-gram containment scan of the benchmark against a toy pretraining corpus. */
export function ContaminationScan() {
  const [threshold, setThreshold] = useState(DEFAULT_CONTAM_THRESHOLD)

  const { flagged, reported, honest, cleanCount } = contaminationReport(threshold)
  const nFlagged = flagged.filter(Boolean).length

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block min-w-56 font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>flag threshold · 3-gram containment</span>
            <span className="text-ink">{threshold.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <div className="flex gap-8 text-right">
          <div>
            <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
              reported
            </p>
            <p
              className={cn(
                'font-display font-medium text-3xl tabular-nums',
                nFlagged > 0 ? 'text-ink-faint line-through' : 'text-ink',
              )}
            >
              {(reported * 100).toFixed(0)}%
            </p>
          </div>
          <div>
            <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
              on {cleanCount} clean items
            </p>
            <p className="font-display font-medium text-3xl text-vermillion tabular-nums">
              {(honest * 100).toFixed(0)}%
            </p>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-1.5">
        {BENCH.map((item, i) => {
          const hit = CONTAMINATION[i]
          const isFlagged = flagged[i]
          return (
            <div
              key={item.q}
              className={cn(
                'grid grid-cols-[1fr_8rem_auto] items-center gap-3 border-paper-edge border-t py-1.5 font-mono text-[0.7rem]',
                isFlagged && 'text-ink',
              )}
            >
              <span className={cn('truncate', isFlagged ? 'text-ink' : 'text-ink-soft')}>
                {item.q}?
              </span>
              <span className="relative h-2 bg-paper-deep">
                <span
                  className={cn(
                    'absolute inset-y-0 left-0',
                    isFlagged ? 'bg-vermillion' : 'bg-paper-edge',
                  )}
                  style={{ width: `${hit.maxSim * 100}%` }}
                />
              </span>
              <span className="w-40 text-right">
                {isFlagged ? (
                  <span className="text-vermillion">found in "{hit.source}" · memorized</span>
                ) : (
                  <span className={item.correct ? 'text-moss' : 'text-ink-faint'}>
                    {item.correct ? '✓ solved' : '✗ missed'}
                  </span>
                )}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          The scanner found {nFlagged} benchmark items verbatim or near-verbatim in the training
          corpus — a quiz blog and a forum answer, which is exactly how it happens in the wild:{' '}
          <strong className="text-ink">the test set is on the web</strong>, so models train on it by
          accident. Every serious eval states a decontamination protocol; scores without one deserve
          the strikethrough.
        </p>
      </div>
    </div>
  )
}
