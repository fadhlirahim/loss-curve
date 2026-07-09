import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import { BatchViewer } from '@/components/training-loop/batch-viewer'
import { PerplexityDial } from '@/components/training-loop/perplexity-dial'
import { ScheduleLab } from '@/components/training-loop/schedule-lab'
import { TrainLab } from '@/components/training-loop/train-lab'

export const Route = createFileRoute('/learn/training-loop')({
  head: () => ({
    meta: [{ title: 'The training loop at language scale, interactively · Roadmap to Mastery' }],
  }),
  component: TrainingLoopPage,
})

function TrainingLoopPage() {
  const [modelValLoss, setModelValLoss] = useState<number | undefined>(undefined)

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
          The training loop at language scale
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          It's the{' '}
          <Link to="/learn/neural-net" className="link-ink">
            same loop you already ran
          </Link>{' '}
          — forward, loss, backward, step — with three new problems bolted on:{' '}
          <strong>
            a data firehose you can only sip from, a learning rate that has to change over time, and
            a number you have to learn to distrust
          </strong>
          . Below, the whole loop runs for real in your browser on the smallest language model that
          can learn anything at all.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="L = -\tfrac{1}{BT}\textstyle\sum \log p(\text{next token})"
            className="text-[1.05rem] text-ink"
          />
          <span>— how surprised the model is, averaged over every cell of the batch.</span>
        </p>
      </div>

      {/* ── §1 data → batches ────────────────────────────────── */}
      <Section label="§ 1 · Data → batches" title="The firehose, diced">
        <p className="prose-note mb-8 max-w-2xl">
          A language model's dataset isn't rows with labels — it's <strong>one long stream</strong>,
          and the labels are free: every character's label is simply the next character. A batch is
          B random windows of T characters each. Drag the dials and watch what one training step
          actually sees.
        </p>
        <BatchViewer />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — real pretraining is this picture with T≈4096, B in the hundreds, and a stream of
          ~15 trillion tokens that the model sees roughly once.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 live training ─────────────────────────────────── */}
      <Section label="§ 2 · The loop, live" title="Watch the number go down — for real">
        <p className="prose-note mb-8 max-w-2xl">
          This trains a real <strong>bigram language model</strong> in your browser: one 24×24
          matrix of logits — "given this char, how plausible is each next char" — cross-entropy
          loss, minibatch SGD. No framework, no fake curves. Press train, then{' '}
          <strong>crank η to the top of the dial</strong> and watch what too-hot steps do to a loss
          curve. The samples underneath are drawn from the live weights: gibberish organizes into
          letter-pair English as the loss falls.
        </p>
        <TrainLab onValLoss={setModelValLoss} />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — the model guesses the next char from the current char ONLY. that ignorance of
          context is exactly what the bigram-floor line measures, and what attention exists to fix.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 the schedule ──────────────────────────────────── */}
      <Section label="§ 3 · The schedule" title="η is not a constant">
        <p className="prose-note mb-8 max-w-2xl">
          Real runs don't pick one learning rate — they <strong>schedule</strong> it:{' '}
          <strong>warm up</strong> from ~zero (early gradients on random weights are violent, and
          Adam's statistics are garbage for the first few hundred steps), cruise at peak, then{' '}
          <strong>cosine-decay</strong> so the run can settle into a minimum instead of orbiting it.
          Shape the curve, then race it against a fixed η on identical batches.
        </p>
        <ScheduleLab />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 reading the number ────────────────────────────── */}
      <Section label="§ 4 · Reading the number" title="Loss lies less as perplexity">
        <p className="prose-note mb-8 max-w-2xl">
          Cross-entropy is exponential-scale: a drop from 3.2 to 2.5 and a drop from 1.5 to 0.8 are
          the same 0.7, but wildly different achievements. <strong>e^loss — perplexity</strong> — is
          the honest unit: "the model is effectively choosing between this many options." And always
          ask <em>which</em> loss: train loss can fall forever while the model just memorizes; the{' '}
          <strong>held-out val loss</strong> (the dashed curve in §2) is the only number that means
          anything — a discipline Phase 4 turns into a whole craft.
        </p>
        <PerplexityDial modelValLoss={modelValLoss} />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 the takeaway ──────────────────────────────────── */}
      <Section label="§ 5 · The whole loop" title="Three habits that scale">
        <RuleCards
          items={[
            {
              rule: 'a batch is B×T exams',
              tex: '\\text{tokens/step} = B \\times T',
              why: 'Every position in every window is a training example. Language data labels itself — the target is just the stream shifted by one.',
            },
            {
              rule: 'η is the loudest dial',
              tex: '\\eta_t = \\text{warmup} \\rightarrow \\text{cosine}',
              why: 'Too cold never arrives, too hot never settles. Schedule it: warm up while the weights are random, decay so the run can land.',
            },
            {
              rule: 'read loss as perplexity',
              tex: '\\text{ppl} = e^{L_{\\text{val}}}',
              why: 'Exp-scale numbers deceive on a linear axis — and only the held-out loss counts. Train loss going down is not learning; val loss going down is.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          nanoGPT's <strong>train.py is this exact page</strong>: the same get_batch dicing a
          stream, the same warmup+cosine schedule, the same cross-entropy read as val loss — with
          the 24×24 matrix swapped for a transformer. nanoGPT is deprecated and frozen now, which
          only makes that file better reading; its successor <strong>nanochat</strong> runs this
          same loop inside the full pipeline. You've now seen every part small; Phase 2's
          deliverable is to assemble them yourself at full size.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '2' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 2 — train a real GPT →
          </Link>
          <Link to="/learn/neural-net" className="link-ink font-mono text-sm">
            the loop's first appearance — a neural net from scratch
          </Link>
          <a
            href="https://github.com/karpathy/nanoGPT"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            nanoGPT — this page at full size (frozen) ↗
          </a>
          <a
            href="https://github.com/karpathy/nanochat"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            nanochat — its successor ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
