import { MAX_MERGES, tokenize, vocabAt } from '@/components/tokenizer/model'
import { TokenChips } from '@/components/tokenizer/token-chips'

/**
 * §3 — encode any text with the merges learned in §2. Shares the merge-count
 * state with the trainer above, so scrubbing either slider moves both.
 */
export function TokenizeAnything({
  m,
  setM,
  input,
  setInput,
}: {
  m: number
  setM: (m: number) => void
  input: string
  setInput: (s: string) => void
}) {
  const tokens = tokenize(input, m)
  const chars = [...input].length
  const unknowns = tokens.filter((t) => t.id < 0).length

  return (
    <div id="lab" className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <label className="block font-mono text-xs">
        <span className="text-[0.65rem] text-ink-faint uppercase tracking-widest">
          type anything
        </span>
        <input
          type="text"
          value={input}
          maxLength={80}
          onChange={(e) => setInput(e.target.value)}
          className="mt-2 w-full border border-paper-edge bg-paper-bright px-3 py-2.5 font-mono text-[0.85rem] text-ink outline-none focus:border-vermillion"
        />
      </label>

      <div className="mt-5">
        <TokenChips tokens={tokens} showIds />
      </div>

      <p className="mt-4 border-paper-edge border-t pt-4 font-mono text-ink-soft text-xs">
        <strong className="text-ink">{tokens.length} tokens</strong> for {chars} characters · vocab{' '}
        {vocabAt(m)}
        {unknowns > 0 && (
          <span className="text-vermillion"> · {unknowns} not in the vocabulary at all</span>
        )}
        {m === 0 && (
          <span className="text-ink-faint"> · zero merges — train some below or in §2</span>
        )}
      </p>

      <label className="mt-4 block font-mono text-xs">
        <span className="flex justify-between text-ink-soft">
          <span>merges learned (shared with §2)</span>
          <span className="text-ink">
            {m}/{MAX_MERGES}
          </span>
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
    </div>
  )
}
