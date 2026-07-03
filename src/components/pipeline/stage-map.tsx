import { useState } from 'react'
import { STAGES, type StageId } from '@/components/pipeline/model'
import { cn } from '@/lib/utils'

/**
 * §1 — the four stage cards in flow order, with an evolving model-card chip
 * row on each. Click a stage; the detail panel below unpacks it.
 */
export function StageMap() {
  const [selected, setSelected] = useState<StageId>('pretrain')

  const stage = STAGES.find((s) => s.id === selected) ?? STAGES[0]

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-stretch gap-2">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex min-w-[10rem] flex-1 items-stretch gap-2">
            <button
              type="button"
              onClick={() => setSelected(s.id)}
              className={cn(
                'flex-1 border p-3 text-left transition-colors',
                s.optional && 'border-dashed',
                s.id === selected
                  ? 'border-vermillion bg-vermillion/10'
                  : 'border-paper-edge bg-paper-bright hover:border-ink',
              )}
            >
              <p className="font-mono text-[0.7rem] text-ink uppercase tracking-widest">
                {s.name}
                {s.optional && <span className="ml-2 text-gold normal-case">optional</span>}
              </p>
              <p className="mt-1.5 text-[0.83rem] text-ink-soft leading-snug">{s.tagline}</p>
              <p className="mt-2.5 flex flex-wrap gap-1">
                {s.modelCard.map((chip) => (
                  <span
                    key={chip}
                    className="border border-paper-edge bg-paper px-1.5 py-0.5 font-mono text-[0.6rem] text-ink-soft"
                  >
                    {chip}
                  </span>
                ))}
              </p>
            </button>
            {i < STAGES.length - 1 && (
              <span className="hidden self-center font-mono text-ink-faint sm:block">→</span>
            )}
          </div>
        ))}
      </div>

      <dl className="mt-5 space-y-3 border-vermillion border-l-2 bg-paper-bright px-4 py-4">
        {(
          [
            ['data in', stage.dataIn],
            ['objective', stage.objective],
            ['artifact out', stage.artifactOut],
            ['cost · speedrun tier', stage.cost],
            ['without it', stage.breaksWithout],
          ] as const
        ).map(([label, value]) => (
          <div key={label} className="grid gap-x-5 gap-y-0.5 sm:grid-cols-[9.5rem_1fr]">
            <dt className="font-mono text-[0.65rem] text-vermillion uppercase tracking-widest">
              {label}
            </dt>
            <dd className="max-w-2xl text-[0.92rem] text-ink-soft leading-relaxed">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
