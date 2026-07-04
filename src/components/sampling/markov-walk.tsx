import { useState } from 'react'
import { greedyWalk, sampleWalk } from '@/components/sampling/model'
import { cn } from '@/lib/utils'

type Mode = 'greedy' | 'warm' | 'cool'

const MODES: { id: Mode; label: string; hint: string }[] = [
  { id: 'greedy', label: 'decode greedy', hint: 'always the argmax' },
  { id: 'warm', label: 'sample · T=1', hint: 'the trained distribution' },
  { id: 'cool', label: 'sample · T=0.3', hint: 'near-greedy' },
]

const TICKERS: Record<Mode, string> = {
  greedy:
    'Every step picks the single most likely next word, and the chain has a most-likely loop — so greedy walks it forever. Repetition is what maximum-likelihood decoding does to a language model; the fix is a decoding choice, not a training one.',
  warm: 'Sampling follows the trained probabilities, so the walk escapes the loop and ends somewhere plausible. Resample: a different sentence each time, every one of them licensed by the model.',
  cool: 'T = 0.3 sharpens each row toward its argmax — most walks hug the greedy path and some still fall into the loop. Temperature interpolates between the two behaviors above.',
}

/** §2 — the same tiny model, three decoders, three different texts. */
export function MarkovWalk() {
  const [mode, setMode] = useState<Mode>('greedy')
  const [seed, setSeed] = useState(1)

  const greedy = greedyWalk()
  const words = mode === 'greedy' ? greedy.words : sampleWalk(seed, mode === 'warm' ? 1 : 0.3)
  const cycleStart = mode === 'greedy' ? greedy.cycleStart : -1

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              'border px-3 py-2 font-mono text-xs transition-colors',
              m.id === mode
                ? 'border-ink bg-ink text-paper'
                : 'border-paper-edge text-ink-soft hover:border-ink',
            )}
          >
            {m.label}{' '}
            <span className={m.id === mode ? 'text-paper-deep' : 'text-ink-faint'}>· {m.hint}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          disabled={mode === 'greedy'}
          className="border border-paper-edge px-3 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          resample ↻
        </button>
      </div>

      <div className="mt-5 flex min-h-[3.2rem] flex-wrap items-center gap-1.5">
        {words.map((w, i) => (
          <span
            key={`${w}-${
              // biome-ignore lint/suspicious/noArrayIndexKey: words repeat by design; position is the identity
              i
            }`}
            className={cn(
              'border px-2 py-1 font-mono text-sm',
              cycleStart !== -1 && i >= cycleStart
                ? 'border-vermillion bg-vermillion/10 text-ink'
                : 'border-paper-edge bg-paper-bright text-ink',
            )}
          >
            {w}
          </span>
        ))}
        {mode === 'greedy' ? (
          <span className="font-mono text-sm text-vermillion">… forever</span>
        ) : (
          <span className="font-mono text-ink-faint text-sm">.</span>
        )}
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">{TICKERS[mode]}</p>
      </div>
    </div>
  )
}
