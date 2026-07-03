import { useState } from 'react'
import { ATTN_CAUSAL, pct, TOKENS, topTargets } from '@/components/attention/model'
import { Chips } from '@/components/lab/chips'
import { cn } from '@/lib/utils'

const heat = (w: number) =>
  `color-mix(in oklab, var(--color-vermillion-deep) ${Math.min(100, Math.round(w * 130))}%, var(--color-paper-bright))`

/**
 * §4 — the payoff: a token's softmax row rendered as the spending budget it
 * is, plus the top contributors. "After this layer, 'it' is 36% bird."
 */
export function BlendBar() {
  const [token, setToken] = useState(6)

  const weights = ATTN_CAUSAL[token]
  const top3 = topTargets(token).slice(0, 3)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <Chips
        label="what flows into…"
        options={TOKENS.map((t, j) => ({ id: String(j), label: t }))}
        value={String(token)}
        onPick={(id) => setToken(Number(id))}
      />

      <div className="mt-6 flex h-10 gap-[2px]">
        {weights.map((w, j) => {
          if (w < 0.005) return null
          return (
            <div
              key={`seg-${TOKENS[j]}-${
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens repeat; position is the identity
                j
              }`}
              title={`${TOKENS[j]} · ${pct(w)}`}
              className={cn(
                'flex min-w-[2px] items-center justify-center overflow-hidden',
                w > 0.42 ? 'text-paper-bright' : 'text-ink',
              )}
              style={{ flexGrow: w, background: heat(w) }}
            >
              {w >= 0.09 && (
                <span className="whitespace-nowrap font-mono text-[0.62rem]">{TOKENS[j]}</span>
              )}
            </div>
          )
        })}
      </div>

      <ul className="mt-5 max-w-md space-y-1.5">
        {top3.map(({ w, j }) => (
          <li
            key={`top-${j}`}
            className="grid grid-cols-[5rem_1fr_3.2rem] items-center gap-3 font-mono text-[0.75rem]"
          >
            <span className="text-ink-soft">"{TOKENS[j]}"</span>
            <span className="relative h-2 bg-paper-deep">
              <span
                className="absolute inset-y-0 left-0 bg-vermillion"
                style={{ width: `${w * 100}%` }}
              />
            </span>
            <span className="text-right text-ink tabular-nums">{pct(w)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-5 max-w-2xl text-[0.9rem] text-ink-faint leading-relaxed">
        {token === 6 ? (
          <>
            After this layer, the vector at position 7 is no longer generic "it" — it's{' '}
            <strong className="text-ink">{pct(weights[1])} bird</strong>. The next layer up reads
            that enriched vector and never knows a pronoun was there.
          </>
        ) : (
          <>
            <strong className="text-ink">"{TOKENS[token]}"</strong> rewrites itself with this
            budget. Every position does this simultaneously, every layer, in one matrix multiply.
          </>
        )}
      </p>
    </div>
  )
}
