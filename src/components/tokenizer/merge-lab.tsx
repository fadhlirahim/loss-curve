import {
  CORPUS_WORDS,
  corpusTokenCount,
  encodeWord,
  MAX_MERGES,
  MERGES,
  vocabAt,
  wordFreqOf,
} from '@/components/tokenizer/model'
import { cn } from '@/lib/utils'

/**
 * §2 — the BPE training loop, one merge per step. The corpus re-renders as
 * chunks that coarsen; the table records what was learned; the ticker
 * narrates the merge that just happened.
 */
export function MergeLab({ m, setM }: { m: number; setM: (m: number) => void }) {
  const last = m > 0 ? MERGES[m - 1] : null

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* the corpus, chunked at the current merge count */}
      <div className="flex flex-wrap gap-x-3 gap-y-2">
        {CORPUS_WORDS.map((word) => (
          <span
            key={word}
            className="inline-flex gap-px"
            title={`"${word}" × ${wordFreqOf(word)} in the corpus`}
          >
            {encodeWord(word, m).map((sym, i) => (
              <span
                key={`${word}-${sym}-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: symbols repeat; position is the identity
                  i
                }`}
                className={cn(
                  'border px-1 py-0.5 font-mono text-[0.7rem] text-ink',
                  last && sym === last.symbol
                    ? 'border-vermillion bg-vermillion/15'
                    : 'border-paper-edge bg-paper-bright',
                )}
              >
                {sym}
              </span>
            ))}
          </span>
        ))}
      </div>

      {/* controls — the backprop stepper, retrained on BPE */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-paper-edge border-t pt-5">
        <button
          type="button"
          onClick={() => setM(Math.min(MAX_MERGES, m + 1))}
          disabled={m >= MAX_MERGES}
          className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion disabled:opacity-40 disabled:hover:bg-ink"
        >
          {m === 0 ? 'learn the first merge →' : 'merge →'}
        </button>
        <button
          type="button"
          onClick={() => setM(Math.max(0, m - 1))}
          disabled={m === 0}
          className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          ← unlearn
        </button>
        <button
          type="button"
          onClick={() => setM(0)}
          disabled={m === 0}
          className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          reset
        </button>
        <span className="font-mono text-ink-faint text-xs">
          {m}/{MAX_MERGES} merges · vocab {vocabAt(m)} · corpus {corpusTokenCount(m)} tokens
        </span>
      </div>
      <label className="mt-4 block font-mono text-xs">
        <span className="flex justify-between text-ink-soft">
          <span>or scrub the whole training run</span>
          <span className="text-ink">{m}</span>
        </span>
        <input
          type="range"
          min={0}
          max={MAX_MERGES}
          step={1}
          value={m}
          onChange={(e) => setM(Number(e.target.value))}
          className="mt-1 w-full accent-vermillion"
        />
      </label>

      {/* the ticker */}
      <div
        className={cn(
          'mt-4 border-l-2 px-4 py-3',
          last ? 'border-vermillion bg-paper-bright' : 'border-paper-edge',
        )}
      >
        {last ? (
          <>
            <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
              merge #{m} · the most frequent pair
            </p>
            <p className="mt-1.5 font-mono text-[0.85rem] text-ink">
              ('{last.a}', '{last.b}') appeared <strong>{last.count}×</strong> → new token '
              <strong>{last.symbol}</strong>' (id {vocabAt(m) - 1})
            </p>
            <p className="mt-2 max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
              Count every adjacent pair, glue the winner, repeat. Nothing else happens in BPE
              training — compression is the whole objective, and whatever repeats becomes an atom.
            </p>
          </>
        ) : (
          <p className="font-mono text-ink-faint text-xs">
            no merges learned — every word is spelled out character by character,{' '}
            {corpusTokenCount(0)} tokens of pure alphabet. press the button and watch the corpus
            coarsen.
          </p>
        )}
      </div>

      {/* the merge table */}
      {m > 0 && (
        <div className="mt-4 max-h-44 overflow-y-auto border border-paper-edge bg-paper-bright/60">
          <table className="w-full font-mono text-[0.7rem]">
            <tbody>
              {MERGES.slice(0, m)
                .map((mg, i) => ({ mg, i }))
                .reverse()
                .map(({ mg, i }) => (
                  <tr
                    key={mg.symbol}
                    className={cn(
                      'border-paper-edge border-b last:border-0',
                      i === m - 1 && 'bg-vermillion/10 text-ink',
                    )}
                  >
                    <td className="px-3 py-1 text-ink-faint">#{i + 1}</td>
                    <td className="px-3 py-1 text-ink-soft">
                      ('{mg.a}', '{mg.b}')
                    </td>
                    <td className="px-3 py-1 text-ink-faint">×{mg.count}</td>
                    <td className="px-3 py-1 text-ink">→ '{mg.symbol}'</td>
                    <td className="px-3 py-1 text-right text-ink-faint">id {vocabAt(i + 1) - 1}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
