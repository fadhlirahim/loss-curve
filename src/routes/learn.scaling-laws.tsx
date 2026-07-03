import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { RuleCards } from '@/components/lab/cards'
import { BendPanel } from '@/components/scaling-laws/bend-panel'
import { CostPanel } from '@/components/scaling-laws/cost-panel'
import { LawPanel } from '@/components/scaling-laws/law-panel'
import { UCurve } from '@/components/scaling-laws/u-curve'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/scaling-laws')({
  head: () => ({ meta: [{ title: 'Scaling laws, interactively · Roadmap to Mastery' }] }),
  component: ScalingLawsPage,
})

function ScalingLawsPage() {
  const [logC, setLogC] = useState(21)

  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">
          Interactive explainer ·{' '}
          <Link to="/phases/$phaseId" params={{ phaseId: '3' }} className="hover:underline">
            Phase 3 — Training &amp; systems
          </Link>
        </p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Scaling laws
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          Before you spend a single GPU-hour, a three-term formula tells you roughly what loss
          you'll get for <strong>any</strong> model size and token count — and therefore how a fixed
          budget should be split between the two. This page is that formula made draggable. It's
          also a calculator you'll actually reuse: every Phase 3 experiment starts with "what does
          this cost?"
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="L(N, D) = E + \frac{A}{N^{\alpha}} + \frac{B}{D^{\beta}}"
            className="text-[1.05rem] text-ink"
          />
          <span>— irreducible entropy, a params term, a data term. That's the whole law.</span>
        </p>
      </div>

      {/* ── §1 the law ───────────────────────────────────────── */}
      <Section label="§ 1 · The law, live" title="Two dials, one predicted loss">
        <p className="prose-note mb-8 max-w-2xl">
          Drag N and D and read off the loss a Chinchilla-style law predicts. The bar shows{' '}
          <strong>which term is holding you back</strong>: grey is the entropy of language itself
          (no model removes it), vermillion is "too few parameters", moss is "too few tokens".
          Whichever colored term is bigger is where your next FLOP should go.
        </p>
        <LawPanel />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — constants from the Epoch AI replication (
          <a
            href="https://arxiv.org/abs/2404.10102"
            target="_blank"
            rel="noreferrer"
            className="link-ink"
          >
            Besiroglu et al. 2024
          </a>
          ) of Chinchilla's approach-3 fit, on MassiveText. Treat the shape as the lesson, not the
          digits.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 the u-curve ───────────────────────────────────── */}
      <Section label="§ 2 · One budget, spent well" title="The U-curve every lab argues about">
        <p className="prose-note mb-8 max-w-2xl">
          Fix a compute budget C = 6ND and sweep the model size: too big and it's under-trained, too
          small and it's data-saturated. The bottom of the U is the <strong>compute-optimal</strong>{' '}
          split — and it lands near <strong>~20 tokens per parameter</strong> at every budget. Park
          the gold marker where you'd have sized it and read the loss you'd give up.
        </p>
        <UCurve logC={logC} setLogC={setLogC} />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — the optimum is found numerically from fig. 1's formula, not hardcoded. Slide C
          across seven orders of magnitude: the ratio barely moves.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 the calculator ────────────────────────────────── */}
      <Section label="§ 3 · What it costs" title="FLOPs → hours → dollars">
        <p className="prose-note mb-8 max-w-2xl">
          A budget in FLOPs is an abstraction; a rental invoice isn't. Pick hardware, set an honest
          MFU (<strong>40% is good</strong>; 60% is a systems paper), and the §2 budget becomes
          wall-clock and money. The presets are the budgets you'll actually meet in Phase 2–3.
        </p>
        <CostPanel logC={logC} setLogC={setLogC} />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 3 — peak numbers are dense bf16, not the sparsity-doubled marketing sheet. Rental
          prices are editable defaults; they drift monthly.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 where it bends ────────────────────────────────── */}
      <Section
        label="§ 4 · Where the law bends"
        title="Chinchilla assumes you never serve the model"
      >
        <p className="prose-note mb-8 max-w-2xl">
          Compute-optimal minimizes <em>training</em> cost — but every parameter you keep costs 2N
          FLOPs on every token you ever serve. Tick "the model will be served" and watch the
          cheapest point slide toward{' '}
          <strong>smaller models trained far past 20 tokens/param</strong>. That's the Llama/SmolLM
          regime, and it's why the small-models field over-trains on purpose.
        </p>
        <BendPanel />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 4 — the Sardana–Frankle framing: minimize train + lifetime-inference FLOPs at a fixed
          quality bar. The dashed curve is training cost alone.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 takeaway ──────────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Three numbers to carry into every experiment">
        <RuleCards
          items={[
            {
              rule: 'compute splits between N and D',
              tex: 'C \\approx 6ND',
              why: 'Six FLOPs per parameter per token. Every budget question starts here.',
            },
            {
              rule: '~20 tokens/param is the ridge',
              tex: 'D^* / N^* \\approx 20',
              why: "Chinchilla's answer at every budget — if training loss is all you optimize.",
            },
            {
              rule: 'serving bends it small',
              tex: 'C_{total} = 6ND + 2N D_{inf}',
              why: 'Inference bills by the parameter. Models meant to be used are trained long past the ridge.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          The law is a planning tool, not a physics constant — it moves with data quality, which is
          why the next lab is about <strong>data</strong>, and why "small but well-trained" is a
          real niche rather than a consolation prize. Before any Phase 3 run:{' '}
          <strong>price it here first</strong>.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '3' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 3 — reproduce &amp; ablate →
          </Link>
          <Link to="/learn/training-loop" className="link-ink font-mono text-sm">
            the loop this law prices
          </Link>
          <a
            href="https://arxiv.org/abs/2203.15556"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Chinchilla paper ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
