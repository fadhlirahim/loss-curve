import type { Token } from '@/components/tokenizer/model'
import { cn } from '@/lib/utils'

/** Four paper-safe tints cycled by position — boundaries carry the identity,
 * color just makes adjacent chunks easy to tell apart in both themes. */
const TINTS = [
  'color-mix(in oklab, var(--color-vermillion) 14%, var(--color-paper-bright))',
  'color-mix(in oklab, var(--color-moss) 16%, var(--color-paper-bright))',
  'color-mix(in oklab, var(--color-gold) 18%, var(--color-paper-bright))',
  'color-mix(in oklab, var(--color-ink) 8%, var(--color-paper-bright))',
]

export function TokenChips({ tokens, showIds = false }: { tokens: Token[]; showIds?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1">
      {tokens.map((t, i) => {
        const unknown = t.id < 0
        return (
          <span
            key={`${t.sym}-${
              // biome-ignore lint/suspicious/noArrayIndexKey: tokens repeat; position is the identity
              i
            }`}
            title={unknown ? `'${t.sym}' — not in the vocabulary` : `'${t.sym}' — token id ${t.id}`}
            className={cn(
              'inline-flex items-baseline gap-1 border px-1.5 py-0.5 font-mono text-[0.72rem] text-ink',
              unknown ? 'border-vermillion border-dashed' : 'border-paper-edge',
            )}
            style={{ background: unknown ? undefined : TINTS[i % TINTS.length] }}
          >
            {t.sym}
            {showIds && (
              <span
                className={cn('text-[0.55rem]', unknown ? 'text-vermillion' : 'text-ink-faint')}
              >
                {unknown ? '∉' : t.id}
              </span>
            )}
          </span>
        )
      })}
    </div>
  )
}
