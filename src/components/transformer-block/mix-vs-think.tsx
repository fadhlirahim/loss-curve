import { useState } from 'react'
import { ATTN_CAUSAL, heat, pct, TOKENS } from '@/components/attention/model'
import { cn } from '@/lib/utils'

const HATCH =
  'repeating-linear-gradient(45deg, var(--color-paper-deep) 0 2px, var(--color-paper) 2px 4px)'

function MiniGrid({
  title,
  caption,
  focus,
  onFocus,
  weight,
}: {
  title: string
  caption: string
  focus: number
  onFocus: (i: number) => void
  /** weight(i, j): how much position i's output draws on position j's input. */
  weight: (i: number, j: number) => number | null
}) {
  return (
    <div className="border border-paper-edge bg-paper-deep/30 p-4">
      <h4 className="font-mono text-[0.66rem] text-vermillion uppercase tracking-widest">
        {title}
      </h4>
      <div className="mt-3 grid grid-cols-9 gap-px">
        {TOKENS.flatMap((_, i) =>
          TOKENS.map((_t, j) => {
            const w = weight(i, j)
            return (
              <button
                key={`${title}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: static matrix; position is the identity
                  i * TOKENS.length + j
                }`}
                type="button"
                aria-label={`row ${TOKENS[i]}, column ${TOKENS[j]}`}
                onMouseEnter={() => onFocus(i)}
                onFocus={() => onFocus(i)}
                title={w === null ? undefined : `${TOKENS[i]} ← ${TOKENS[j]} · ${pct(w)}`}
                className={cn(
                  'block aspect-square border-0 p-0',
                  i === focus ? 'opacity-100' : 'opacity-45',
                )}
                style={{ background: w === null ? HATCH : heat(w) }}
              />
            )
          }),
        )}
      </div>
      <p className="mt-3 text-[0.83rem] text-ink-soft leading-relaxed">{caption}</p>
    </div>
  )
}

/**
 * §3 — the same 9 tokens through both branches: attention reads across
 * positions (a causal triangle), the MLP touches only the diagonal.
 */
export function MixVsThink() {
  const [focus, setFocus] = useState(6)

  return (
    <div>
      <div className="grid gap-5 sm:grid-cols-2">
        <MiniGrid
          title="attention · mixes across positions"
          caption='Row = output token, column = where it reads from. "it" pulls from "bird" four positions away — information crosses tokens here and only here.'
          focus={focus}
          onFocus={setFocus}
          weight={(i, j) => (j > i ? null : ATTN_CAUSAL[i][j])}
        />
        <MiniGrid
          title="mlp · thinks per position"
          caption="Same rows, same columns — and nothing off the diagonal. Each token is processed alone, by the same weights, all 9 in parallel. A per-token function applied 9 times."
          focus={focus}
          onFocus={setFocus}
          weight={(i, j) => (i === j ? 1 : 0)}
        />
      </div>
      <p className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3 font-mono text-ink-soft text-xs">
        hovering row: <span className="text-ink">"{TOKENS[focus]}"</span> — attention decides{' '}
        <em>what</em> flows between tokens; the MLP decides <em>what to make of it</em>. Remove
        attention and no token ever learns about another; remove the MLP and the network is (nearly)
        just weighted averaging.
      </p>
    </div>
  )
}
