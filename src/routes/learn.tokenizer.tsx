import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { ExperimentCards, RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { MergeLab } from '@/components/tokenizer/merge-lab'
import { ThreeWays } from '@/components/tokenizer/three-ways'
import { TokenizeAnything } from '@/components/tokenizer/tokenize-anything'

export const Route = createFileRoute('/learn/tokenizer')({
  head: () => ({ meta: [{ title: 'Tokenization, interactively · Roadmap to Mastery' }] }),
  component: TokenizerPage,
})

const DEFAULT_INPUT = 'the bird ate the worm because it was hungry'

const PRESETS: { title: string; story: string; setup: string }[] = [
  {
    title: 'arithmetic',
    story:
      'Digits never merged (our corpus had none), so "12345" is five tokens. GPT-2 was worse: frequency merged "123" into one token but split "1234" into two — inconsistent chunking is one reason LLMs struggle with arithmetic. Modern models special-case digits.',
    setup: '12345 + 67890 = ?',
  },
  {
    title: 'indented code',
    story:
      'Every space burns one token here. GPT-2 had exactly this problem — one token per space made indented Python cripplingly expensive — so OpenAI added dedicated multi-space tokens for Codex. The tokenizer decides what the model is cheap at.',
    setup: '    if ready:        return tokens',
  },
  {
    title: 'outside the alphabet',
    story:
      "é and ï aren't in our alphabet at all — dashed chips, no id, the model would never see them. Real byte-level BPE has no unknowns (every byte is a base token), but the cost moves: rare scripts fragment into many byte-tokens. Same sentence, 3× the tokens, worse quality.",
    setup: 'naïve café déjà vu',
  },
  {
    title: 'a made-up word',
    story:
      'The corpus never taught bird-adjacent subwords, so "unbirdlike" shatters into characters and meaning must be reassembled from shards. Real vocabularies contain junk shards too — the infamous SolidGoldMagikarp token was so undertrained it made GPT-3 glitch on sight.',
    setup: 'the unbirdlike tokenizer',
  },
]

function TokenizerPage() {
  const [m, setM] = useState(0)
  const [input, setInput] = useState(DEFAULT_INPUT)

  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">
          Interactive explainer ·{' '}
          <Link to="/phases/$phaseId" params={{ phaseId: '2' }} className="hover:underline">
            Phase 2 — Transformers &amp; LLMs
          </Link>
        </p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Tokenization
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          A language model never sees letters. It sees <strong>integers</strong> — and the tokenizer
          is the frozen little program that decides which integers. Every strength and every strange
          weakness downstream (arithmetic, code, other languages) is shaped here first, which is why
          the roadmap calls it <strong>an underrated source of bugs and quality</strong>. Below: the
          actual algorithm, running live, small enough to read.
        </p>
        <p className="rise rise-3 mt-4 font-mono text-[0.7rem] text-ink-faint">
          <span className="text-[0.95rem] text-ink">"the bird" → [31, 15, 24, 40, 9]</span>
          <span className="ml-3">— that list is all the model ever gets.</span>
        </p>
      </div>

      {/* ── §1 the tradeoff ──────────────────────────────────── */}
      <Section label="§ 1 · The tradeoff" title="Characters, words, or something in between">
        <p className="prose-note mb-8 max-w-2xl">
          The same sentence, tokenized three ways. Characters make the vocabulary tiny but the
          sequence enormous; words make the sequence short but the vocabulary unbounded.{' '}
          <strong>Subword tokenization is the negotiated middle</strong> — and BPE, below, is how
          the split points get chosen: by frequency, not by linguistics.
        </p>
        <ThreeWays />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 train BPE ─────────────────────────────────────── */}
      <Section label="§ 2 · The algorithm" title="Train a BPE tokenizer, one merge at a time">
        <p className="prose-note mb-8 max-w-2xl">
          Byte-pair encoding is embarrassingly simple: spell every word out,{' '}
          <strong>
            count adjacent pairs, glue the most frequent pair into a new token, repeat
          </strong>
          . This is the real algorithm running on a 50-word corpus — step through it and watch "t h
          e" become "the", then watch "the" swallow its own end-of-word marker ⌟.
        </p>
        <MergeLab m={m} setM={setM} />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — the vermillion chunks are the token the last merge created. GPT-2 ran this loop
          50,000 times over bytes; you're running it {'{'}0…39{'}'} times over characters.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 tokenize anything ─────────────────────────────── */}
      <Section label="§ 3 · The payoff" title="Tokenize anything with what it learned">
        <p className="prose-note mb-8 max-w-2xl">
          Your text, encoded with the merges from §2. <strong>Drag the slider</strong> and watch the
          token count fall as the vocabulary grows — that's the compression the model's context
          window lives on. Common words collapse to one token; anything the corpus never saw stays
          expensive.
        </p>
        <TokenizeAnything m={m} setM={setM} input={input} setInput={setInput} />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 how it hurts ──────────────────────────────────── */}
      <Section label="§ 4 · How it hurts" title="Four ways a tokenizer sabotages a model">
        <p className="prose-note mb-8 max-w-2xl">
          Each card loads a pathological input into the tokenizer above. The failures are toy-sized
          (this tokenizer learned from 50 words), but{' '}
          <strong>every one of them has a famous real-world counterpart</strong> — tokenization is
          where "the model is weirdly bad at X" stories usually start.
        </p>
        <ExperimentCards items={PRESETS} onLoad={setInput} />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 the takeaway ──────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Compression decides the alphabet">
        <RuleCards
          items={[
            {
              rule: 'frequent pairs become atoms',
              why: 'BPE has no idea what a word is — it only counts. Whatever repeats in the training corpus gets one id; linguistics is an accident of frequency.',
            },
            {
              rule: 'the vocab freezes at training time',
              why: "The merges are learned once, then bolted onto the model forever. Whatever the corpus lacked — digits, code, another language — pays per-character for the model's whole life.",
            },
            {
              rule: 'weird text costs tokens',
              why: 'More tokens for the same meaning = less effective context, higher cost, and shards the model barely trained on. "How was this tokenized?" is a real debugging question.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          You just watched the entire algorithm — there is no more magic in it. The real Phase 2 rep
          is building exactly this over <strong>bytes</strong> with regex pre-splitting: Karpathy's
          minbpe is the reference, and it's a weekend. Then go poke at how GPT-4 actually splits
          your text.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '2' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 2 — build a GPT from a blank file →
          </Link>
          <a
            href="https://www.youtube.com/watch?v=zduSFxRajkE"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Karpathy — Let's build the GPT Tokenizer ↗
          </a>
          <a
            href="https://tiktokenizer.vercel.app"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            tiktokenizer — real vocabularies, live ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
