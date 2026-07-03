import { createFileRoute, Link } from '@tanstack/react-router'
import { BlendBar } from '@/components/attention/blend-bar'
import { HeadGrid } from '@/components/attention/head-grid'
import { QkvPanel } from '@/components/attention/qkv-panel'
import { ScoreHeatmap } from '@/components/attention/score-heatmap'
import { SentenceDemo } from '@/components/attention/sentence-demo'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/attention')({
  head: () => ({ meta: [{ title: 'Self-attention, interactively · Roadmap to Mastery' }] }),
  component: AttentionPage,
})

function AttentionPage() {
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
          Self-attention
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          Every layer of a transformer, each word gets to{' '}
          <strong>rewrite itself as a blend of the words before it</strong>. Attention is the
          routing rule that decides the blend: each word broadcasts a <em>question</em>, every
          earlier word holds up an <em>answer</em>, and the match between them — one dot product per
          pair — sets who contributes how much. That's the whole mechanism. Below, it runs live on
          one sentence, small enough to read every number.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="\text{Attention}(Q, K, V) = \text{softmax}\!\left(\tfrac{QK^\top}{\sqrt{d_k}}\right) V"
            className="text-[1.05rem] text-ink"
          />
          <span>— one matrix of questions, one of answers, one of payloads.</span>
        </p>
      </div>

      {/* ── §1 the problem ───────────────────────────────────── */}
      <Section label="§ 1 · The problem" title="A word alone knows nothing">
        <p className="prose-note mb-8 max-w-2xl">
          The word <strong>"it"</strong> is an empty pointer — its meaning lives in some other word.
          Attention is how the model fills it in. <strong>Hover or tap any word</strong> to see
          where it looks; the underline weight is its real attention distribution, computed live
          from the Q·K arithmetic you'll meet in §3. Faded words sit in the future — a decoder can't
          read them.
        </p>
        <SentenceDemo />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — the queries and keys behind this are hand-crafted so every number stays readable;
          the scores, mask, and softmax are the genuine arithmetic.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 three hats ────────────────────────────────────── */}
      <Section label="§ 2 · Three hats" title="Ask, advertise, offer">
        <p className="prose-note mb-8 max-w-2xl">
          Each word's embedding is projected three ways: a{' '}
          <strong className="text-vermillion">query</strong> ("what am I looking for?"), a{' '}
          <strong className="text-moss-deep dark:text-moss">key</strong> ("what do I advertise?"),
          and a <strong>value</strong> ("what will I hand over if picked?"). In a real model these
          live in hundreds of unlabeled dimensions the model invents for itself; here we hand-built{' '}
          <strong>four legible ones</strong> so you can read the vectors like a form.
        </p>
        <QkvPanel />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 the score sheet ───────────────────────────────── */}
      <Section label="§ 3 · The score sheet" title="Every query meets every key">
        <p className="prose-note mb-8 max-w-2xl">
          Dot every query with every key and you get the score matrix — rows ask, columns answer.
          Walk the pipeline: <strong>raw scores → scale → mask → softmax</strong>. Hover any cell to
          see the arithmetic, dimension by dimension.
        </p>
        <ScoreHeatmap />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — notice what's missing: nothing in QKᵀ knows where a word <em>sits</em>. Shuffle
          the sentence and every score survives. That blindness is why attention needs positional
          information (RoPE) — the next explainer in this phase.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 the mix ───────────────────────────────────────── */}
      <Section label="§ 4 · The mix" title="Output is a weighted blend">
        <p className="prose-note mb-8 max-w-2xl">
          The softmax row is a <strong>spending budget</strong>: each word spends 100% of its update
          across the values of the words it attended to, then{' '}
          <em>adds the result to its own vector</em> (the residual stream — the detail that lets
          deep transformers train at all). This is the payoff: after this layer, "it" literally{' '}
          <em>contains</em> mostly bird.
        </p>
        <BlendBar />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 many heads ────────────────────────────────────── */}
      <Section label="§ 5 · Many heads" title="Different heads learn different jobs">
        <p className="prose-note mb-8 max-w-2xl">
          One attention pattern can't do everything, so the layer runs several{' '}
          <strong>heads</strong> in parallel — same mechanism, different learned projections — and
          concatenates their outputs. Real trained models grow weirdly specialized heads; these
          three minis are caricatures of patterns actually found in GPT-2.
        </p>
        <HeadGrid />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §6 the takeaway ──────────────────────────────────── */}
      <Section label="§ 6 · The whole trick" title="Three moves, one matrix multiply">
        <RuleCards
          items={[
            {
              rule: 'score = agreement',
              tex: 's_{ij} = \\frac{q_i \\cdot k_j}{\\sqrt{d_k}}',
              why: 'A dot product only measures whether the query and key are loud on the same dimensions.',
            },
            {
              rule: 'softmax = a budget',
              tex: 'w_{ij} = \\frac{e^{s_{ij}}}{\\sum_{j\\prime} e^{s_{ij\\prime}}}',
              why: 'Each row becomes 100% of attention to spend. The mask just removes the future from the shop.',
            },
            {
              rule: 'output = the blend',
              tex: 'o_i = \\textstyle\\sum_j w_{ij} \\, v_j',
              why: 'Weighted sum of value vectors, added back to the residual stream. That is the entire layer.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          Everything on this page is a handful of small matrices — no magic survived. If it made
          sense, you're ready for the real Phase 2 deliverable:{' '}
          <strong>
            close this tab and implement multi-head causal self-attention from a blank file
          </strong>
          , then train it inside a GPT. Rebuild it until it's boring — that's the milestone.
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
            href="https://jalammar.github.io/illustrated-transformer/"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            The Illustrated Transformer ↗
          </a>
          <a
            href="https://www.youtube.com/watch?v=kCc8FmEb1nY"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Karpathy — Let's build GPT ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
