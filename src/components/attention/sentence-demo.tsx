import { useState } from 'react'
import { ATTN_CAUSAL, pct, STORIES, TOKENS, topTargets } from '@/components/attention/model'
import { cn } from '@/lib/utils'

/**
 * §1 — hover/tap a word, see its live attention distribution as underline
 * weights on the sentence itself. Defaults to "it", the star of the show.
 */
export function SentenceDemo() {
  const [focus, setFocus] = useState(6)

  const weights = ATTN_CAUSAL[focus]
  const [first, second] = topTargets(focus)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap gap-x-1.5 gap-y-4 pt-4">
        {TOKENS.map((token, j) => {
          const w = weights[j]
          const future = j > focus
          return (
            <button
              key={`${token}-${
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens repeat ("the"); position is the identity
                j
              }`}
              type="button"
              onMouseEnter={() => setFocus(j)}
              onFocus={() => setFocus(j)}
              onClick={() => setFocus(j)}
              className={cn(
                'relative border px-2.5 py-1.5 font-mono text-[0.95rem] transition-colors',
                j === focus
                  ? 'border-vermillion bg-vermillion/10 text-ink'
                  : 'border-paper-edge bg-paper-bright text-ink',
                future && 'opacity-40',
              )}
            >
              {w >= 0.12 && j !== focus && !future && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.58rem] text-vermillion">
                  {pct(w)}
                </span>
              )}
              {token}
              <span
                className="absolute inset-x-0 bottom-[-1px] h-[3px] bg-vermillion transition-opacity"
                style={{ opacity: future ? 0 : w }}
              />
            </button>
          )
        })}
      </div>

      <div className="mt-6 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          {focus === 0 ? (
            <>
              <strong className="text-ink">"the"</strong> opens the sentence — with nothing behind
              it, the causal mask leaves it 100% itself. A corner case worth seeing once.
            </>
          ) : (
            <>
              <strong className="text-ink">"{TOKENS[focus]}"</strong> spends{' '}
              <strong className="text-ink">{pct(first.w)}</strong> of its update on{' '}
              <strong className="text-ink">"{TOKENS[first.j]}"</strong>, {pct(second.w)} on "
              {TOKENS[second.j]}" — {STORIES[focus]}
            </>
          )}
        </p>
      </div>
    </div>
  )
}
