import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { KnobBoard } from '@/components/sampling/knob-board'
import { MarkovWalk } from '@/components/sampling/markov-walk'
import { PassCurves } from '@/components/sampling/pass-curves'
import { SpecDecode } from '@/components/sampling/spec-decode'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/sampling')({
  head: () => ({ meta: [{ title: 'Sampling & inference, interactively · Roadmap to Mastery' }] }),
  component: SamplingPage,
})

function SamplingPage() {
  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">
          Interactive explainer ·{' '}
          <Link to="/phases/$phaseId" params={{ phaseId: '4' }} className="hover:underline">
            Phase 4 — Post-training &amp; eval
          </Link>
        </p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Sampling &amp; inference
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          Training set the probabilities; <strong>decoding decides what you actually see</strong>.
          Temperature, top-k, top-p, greedy-vs-sampled — same weights, different knobs, and the text
          (and the benchmark score) changes. That's why decoding parameters belong in every eval
          report, and why "the model said" always means "the model, decoded this way, said."
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="p_i = \operatorname{softmax}\!\left(z_i / T\right)"
            className="text-[1.05rem] text-ink"
          />
          <span>— one divisor between deterministic and delirious.</span>
        </p>
      </div>

      {/* ── §1 the knobs ─────────────────────────────────────── */}
      <Section label="§ 1 · The knobs" title="Temperature reshapes, truncation deletes">
        <p className="prose-note mb-8 max-w-2xl">
          One real next-token distribution — ten candidates after <em>"The bird ate the …"</em> —
          pushed through the standard pipeline:{' '}
          <strong>divide logits by T, softmax, apply top-k and top-p, renormalize</strong>. Ghost
          bars show the mass each excluded token had before truncation deleted it. Drag T to 0.1,
          then to 2; watch "car" die and resurrect.
        </p>
        <KnobBoard />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — the distribution is hand-crafted; the pipeline arithmetic is the real thing.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 greedy loops ──────────────────────────────────── */}
      <Section label="§ 2 · The failure you've seen" title="Greedy loops, sampling wanders">
        <p className="prose-note mb-8 max-w-2xl">
          A twelve-word Markov chain stands in for a language model — small enough that you can
          verify the loop by hand. Greedy decoding takes the argmax every step, and the argmax path
          has a cycle: <em>the bird ate the bird ate…</em> Sampling follows the same probabilities
          and escapes. Every "why does my model repeat itself" bug report is this demo at scale.
        </p>
        <MarkovWalk />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 evals ─────────────────────────────────────────── */}
      <Section label="§ 3 · The eval tie-in" title="Decoding changes the measured number">
        <p className="prose-note mb-8 max-w-2xl">
          Give a toy solver a success rate that depends on temperature, then score it two ways with
          the exact pass@k formula: <Tex tex="1 - (1 - p)^{k}" />. At T→0 all eight samples are the{' '}
          <em>same</em> attempt, so pass@8 collapses onto pass@1; heat restores the independence
          that multiple attempts pay for. The curves peak at different temperatures — pick your knob
          for the metric you report.
        </p>
        <PassCurves />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — the success-vs-T curve is hand-shaped for legibility; the pass@k arithmetic and
          the duplicate-samples-at-low-T mechanism are real. The evals lab picks this thread up.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 speculative ───────────────────────────────────── */}
      <Section label="§ 4 · Free tokens, exactly" title="Speculative decoding">
        <p className="prose-note mb-8 max-w-2xl">
          A small draft model proposes γ tokens; the big model checks them all in{' '}
          <strong>one</strong> forward pass and keeps the agreeing prefix (plus one token of its
          own). Expected yield per pass:{' '}
          <Tex tex="\mathbb{E} = \tfrac{1 - \alpha^{\gamma+1}}{1 - \alpha}" /> where α is how often
          the draft guesses right. Below, the curve, the strip, and the memory bill that explains
          why verification is nearly free.
        </p>
        <SpecDecode />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 takeaway ──────────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Decoding is part of the model">
        <RuleCards
          items={[
            {
              rule: 'temperature reshapes, truncation deletes',
              tex: 'p_i \\propto e^{z_i / T}',
              why: 'T bends the whole distribution; top-k/top-p amputate the tail and renormalize the survivors.',
            },
            {
              rule: 'greedy is a different model than sampled',
              why: 'Same weights, different text, different benchmark score. Report T, k, p, and n — always.',
            },
            {
              rule: 'speculation is free because decode is memory-bound',
              tex: '\\mathbb{E} = \\tfrac{1-\\alpha^{\\gamma+1}}{1-\\alpha}',
              why: 'Verifying γ tokens re-reads the weights once. Lossless by construction — rejection sampling, not approximation.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          Everything here runs after training is over — which means it's the cheapest place to
          change a model's behavior, and the easiest place to fool yourself when you measure it.
          When you post-train your own small model in this phase,{' '}
          <strong>fix your decoding params before you trust a single number</strong>.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '4' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 4 — post-train &amp; measure honestly →
          </Link>
          <Link to="/learn/evals" className="link-ink font-mono text-sm">
            sibling lab — evaluation
          </Link>
          <Link to="/learn/gpu-systems" className="link-ink font-mono text-sm">
            the roofline this cashes in
          </Link>
          <a
            href="https://arxiv.org/abs/2211.17192"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            speculative decoding paper ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
