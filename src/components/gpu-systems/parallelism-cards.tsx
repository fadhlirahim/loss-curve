import { useState } from 'react'
import { PARALLELISMS } from '@/components/gpu-systems/model'
import { cn } from '@/lib/utils'

const ROWS = [
  { key: 'replicated', label: 'replicated' },
  { key: 'sharded', label: 'sharded' },
  { key: 'communicated', label: 'communicated' },
  { key: 'reachFor', label: 'reach for it when' },
] as const

export function ParallelismCards() {
  const [selected, setSelected] = useState(0)
  const current = PARALLELISMS[selected]

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {PARALLELISMS.map((p, i) => (
          <button
            key={p.name}
            type="button"
            onClick={() => setSelected(i)}
            className={cn(
              'border px-4 py-3 text-left font-mono text-xs transition-colors',
              i === selected
                ? 'border-vermillion bg-vermillion/10 text-ink'
                : 'border-paper-edge text-ink-soft hover:border-ink',
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <dl className="mt-5 space-y-3 border-vermillion border-l-2 bg-paper-bright px-4 py-4">
        {ROWS.map((row) => (
          <div key={row.key} className="grid gap-x-4 sm:grid-cols-[9rem_1fr]">
            <dt className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
              {row.label}
            </dt>
            <dd className="text-[0.92rem] text-ink-soft leading-relaxed">{current[row.key]}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-4 max-w-2xl text-[0.88rem] text-ink-faint leading-relaxed">
        On one GPU you need the reading-level grasp, not the ops experience. One connection worth
        keeping:{' '}
        <strong className="text-ink">
          ZeRO / FSDP is data parallelism with the optimizer states sharded
        </strong>{' '}
        — it attacks exactly the 16-bytes-per-parameter tenant from §1.
      </p>
    </div>
  )
}
