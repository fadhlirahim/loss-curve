import { MAX_MERGES, tokenize, vocabAt } from '@/components/tokenizer/model'
import { TokenChips } from '@/components/tokenizer/token-chips'

const SENTENCE = 'the tokenizer turns the text into tokens'

const CHAR_TOKENS = [...SENTENCE].map((ch, i) => ({
  sym: ch === ' ' ? '␣' : ch,
  id: i, // display only — ids aren't the point of this panel
}))

const WORD_TOKENS = SENTENCE.split(' ').map((w, i) => ({ sym: w, id: i }))

const BPE_TOKENS = tokenize(SENTENCE, MAX_MERGES)

const WAYS = [
  {
    name: 'characters',
    tokens: CHAR_TOKENS,
    seq: CHAR_TOKENS.length,
    vocab: '~50 symbols',
    verdict:
      'tiny vocabulary, but every sequence is enormous — the model wastes its context window spelling.',
  },
  {
    name: 'words',
    tokens: WORD_TOKENS,
    seq: WORD_TOKENS.length,
    vocab: '~600,000 words',
    verdict:
      'short sequences, but the vocabulary explodes — and "tokenizer" might still be missing. One typo = unknown token.',
  },
  {
    name: 'subword (BPE)',
    tokens: BPE_TOKENS,
    seq: BPE_TOKENS.length,
    vocab: `${vocabAt(MAX_MERGES)} here · 50–200k in real models`,
    verdict:
      'the compromise: frequent strings get one token, rare ones fall apart into reusable pieces. Nothing is ever unknown.',
  },
]

/** §1 — the same sentence tokenized three ways, with the costs of each. */
export function ThreeWays() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {WAYS.map((way) => (
        <div key={way.name} className="flex flex-col border border-paper-edge bg-paper-deep/30 p-5">
          <h3 className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
            {way.name}
          </h3>
          <div className="mt-3 flex-1">
            <TokenChips tokens={way.tokens} />
          </div>
          <p className="mt-4 border-paper-edge border-t pt-3 font-mono text-[0.7rem] text-ink-soft">
            {way.seq} tokens · vocab {way.vocab}
          </p>
          <p className="mt-2 text-[0.83rem] text-ink-soft leading-relaxed">{way.verdict}</p>
        </div>
      ))}
    </div>
  )
}
