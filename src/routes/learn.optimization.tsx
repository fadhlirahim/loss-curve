import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { AccumulationDemo } from '@/components/optimization/accumulation-demo'
import { NoisyRavine } from '@/components/optimization/noisy-ravine'
import { TradeoffPlots } from '@/components/optimization/tradeoff-plots'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/optimization')({
  head: () => ({ meta: [{ title: 'Optimization at scale, interactively · Roadmap to Mastery' }] }),
  component: OptimizationPage,
})

function OptimizationPage() {
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
          Optimization at scale
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          The{' '}
          <Link to="/learn/gradient-descent" className="link-ink">
            Phase 1 lab
          </Link>{' '}
          taught you the optimizers. At scale the questions change:{' '}
          <strong>
            the gradient is no longer a fact but a poll of B examples, and someone pays for every
            extra vote
          </strong>{' '}
          — in wall-clock, in memory, or in tokens. This lab is about those three bills.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="\hat{g}_B = \nabla L + \tfrac{\sigma}{\sqrt{B}}\,\xi"
            className="text-[1.05rem] text-ink"
          />
          <span>— the whole phase in one line: more samples, less noise, same truth.</span>
        </p>
      </div>

      {/* ── §1 the gradient is an estimate ───────────────────── */}
      <Section label="§ 1 · The gradient is an estimate" title="A batch is a poll">
        <p className="prose-note mb-8 max-w-2xl">
          Nobody computes the true gradient — that would mean the whole dataset every step. You poll{' '}
          <strong>B examples</strong> and act on the average. Below, the same ravine, the same
          learning rate, the <em>same seeded noise</em> — only B changes. Quadruple the batch and
          the noise halves (σ/√B); the trajectory goes from drunken walk to descent. Notice it never
          truly settles: near the bottom the true gradient vanishes but the noise doesn't, so the
          run orbits in a <strong>noise ball</strong> whose size B controls.
        </p>
        <NoisyRavine />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — drag B and rerun: identical noise draws, rescaled. that's the entire difference
          between a batch of 4 and a batch of 512.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 the critical batch size ───────────────────────── */}
      <Section label="§ 2 · The critical batch size" title="Where parallelism stops being free">
        <p className="prose-note mb-8 max-w-2xl">
          If noise falls as 1/√B, why not batch a million? Because past some point the extra votes
          tell you what you already know. McCandlish et al. put a shape on it:{' '}
          <strong>
            below a critical batch size, doubling B halves your steps almost for free; above it, you
            burn examples to save wall-clock
          </strong>
          . Every serious training run lives somewhere on these two curves.
        </p>
        <TradeoffPlots />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — the shape is the lesson, not the numbers: B_crit grows as training progresses and
          differs by task. measuring it for your run is the gradient-noise-scale paper's whole
          point.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 gradient accumulation ─────────────────────────── */}
      <Section label="§ 3 · Gradient accumulation" title="The same update, on a memory budget">
        <p className="prose-note mb-8 max-w-2xl">
          Big batches need big activation memory — the one thing a single GPU doesn't have. The fix
          is almost embarrassingly simple:{' '}
          <strong>run 4 micro-batches of 8, sum their gradients, take one step</strong>. Below, both
          versions run on identical data with identical seeds: the hollow rings must land on the
          filled dots, every step, because the arithmetic is the same arithmetic. This is how
          million-token batches fit on one card — the price is wall-clock, never correctness.
        </p>
        <AccumulationDemo />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 3 — the largest gap between the trajectories is ~1e-16: floating-point summation
          order, nothing else. when a codebase's accumulation changes the loss, that's a bug, not a
          tradeoff.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 the landscape ─────────────────────────────────── */}
      <Section
        label="§ 4 · The optimizer landscape, 2026"
        title="AdamW is the incumbent; Muon is the challenger"
      >
        <RuleCards
          items={[
            {
              rule: 'AdamW — the default',
              tex: 'w \\leftarrow w - \\eta\\,(\\hat{m}/\\sqrt{\\hat{v}} + \\lambda w)',
              why: 'Adam with weight decay decoupled from the gradient, so regularization is not rescaled by √v̂. Boring, robust, what everything is tuned around.',
            },
            {
              rule: 'Muon — the speedrun win',
              tex: '\\text{momentum} \\to \\text{orthogonalize} \\to \\text{step}',
              why: 'Orthogonalizes the momentum of 2-D weight matrices (Newton–Schulz), roughly ~1.35× data efficiency in modded-nanogpt. An empirical speedrun result — not settled theory.',
            },
            {
              rule: 'The meta-lesson',
              why: 'Optimizer claims are measured in controlled speedruns with fixed data budgets, seeds, and baselines. Read the modded-nanogpt commit log like a textbook: every win is one commit, one number.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          None of this replaces Phase 1: every optimizer here is still{' '}
          <em>gradient times step size</em>, and the ravine from that lab is still the failure mode
          they're all fighting. What changed at scale is the accounting around the step — noise,
          batch, memory — which is exactly what §1–§3 put on screen.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 the takeaway ──────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Three bills, one budget">
        <RuleCards
          items={[
            {
              rule: 'noise ∝ 1/√B',
              tex: '\\hat{g}_B = \\nabla L + \\tfrac{\\sigma}{\\sqrt{B}}\\,\\xi',
              why: 'A batch is a poll. Quadruple the sample, halve the noise — and never better than that.',
            },
            {
              rule: 'below B_crit, parallelism is free',
              tex: 'S(B) = S_{\\min}\\,(1 + B_{\\text{crit}}/B)',
              why: 'Doubling the batch halves the steps until the votes get redundant. Past the knee you pay in tokens.',
            },
            {
              rule: 'accumulation is exact',
              tex: '\\textstyle\\sum_{\\text{micro}} g = g_{\\text{batch}}',
              why: 'Sum micro-batch gradients, step once: identical update, a fraction of the activation memory, more wall-clock.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          If this page made sense, you can now read a training config — batch size, accumulation
          steps, LR schedule — and see the <strong>decisions</strong> instead of the numbers. The
          Phase 3 deliverable is to change exactly one of them on a real run and measure what
          happens: that's the modded-nanogpt reproduction.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '3' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 3 — reproduce a result →
          </Link>
          <Link to="/learn/gradient-descent" className="link-ink font-mono text-sm">
            the Phase 1 optimizer lab (prerequisite)
          </Link>
          <Link to="/learn/training-loop" className="link-ink font-mono text-sm">
            the training-loop lab
          </Link>
          <a
            href="https://github.com/KellerJordan/modded-nanogpt"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            modded-nanogpt ↗
          </a>
          <a
            href="https://arxiv.org/abs/1812.06162"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            McCandlish et al. — gradient noise scale ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
