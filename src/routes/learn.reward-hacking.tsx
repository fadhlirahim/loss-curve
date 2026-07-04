import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { JudgePanel } from '@/components/reward-hacking/judge-panel'
import { HACKS } from '@/components/reward-hacking/model'
import { OveroptLab } from '@/components/reward-hacking/overopt-lab'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/reward-hacking')({
  head: () => ({
    meta: [{ title: 'Reward modeling & hacking, interactively · Roadmap to Mastery' }],
  }),
  component: RewardHackingPage,
})

function RewardHackingPage() {
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
          Reward modeling &amp; reward hacking
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          RLHF needs a number for "this response is good," so we train a{' '}
          <strong>reward model</strong> — a proxy for what we actually want. The problem is that an
          optimizer is a <strong>proxy-gap-finding machine</strong>: apply enough pressure and it
          will locate every place the proxy and the goal disagree, then live there. This page makes
          the gap visible: a judge you can read, and Goodhart's law with a plot.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="\max_\pi \; \mathbb{E}\big[r_\phi(x, y)\big] - \beta\,\mathrm{KL}\big(\pi \,\|\, \pi_{\text{ref}}\big)"
            className="text-[1.05rem] text-ink"
          />
          <span>— maximize the proxy, minus a leash. Both terms of this page.</span>
        </p>
      </div>

      {/* ── §1 the judge ─────────────────────────────────────── */}
      <Section label="§ 1 · The judge" title="A reward model you can read">
        <p className="prose-note mb-8 max-w-2xl">
          Real reward models score text with millions of illegible features. This one uses five you
          can read — on-topic terms, length, magic keywords, bullet points, hedging — with visible
          weights. Five responses to one question, ranked live. <strong>Click a response</strong> to
          see exactly where its score comes from, then drag the length weight.
        </p>
        <JudgePanel />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — the biases are cartoons, but they're the documented ones: judges (human and
          model) measurably over-reward length and confident formatting at equal correctness.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 overoptimization ──────────────────────────────── */}
      <Section label="§ 2 · Overoptimization" title="Goodhart's law, with a gradient">
        <p className="prose-note mb-8 max-w-2xl">
          Train against a proxy and three phases follow: first the proxy and the goal rise together,
          then the goal peaks, then optimization pressure farms pure misspecification while the goal
          collapses. The <strong>KL leash</strong> — a penalty for drifting far from the reference
          policy — is the standard defense: it doesn't fix the proxy, it just stops you before the
          cliff.
        </p>
        <OveroptLab />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — a shaped toy of a measured phenomenon: Gao et al. fit exactly this
          rise-peak-collapse shape to real reward models, with distance from the initial policy on
          the x-axis.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 the gallery ───────────────────────────────────── */}
      <Section label="§ 3 · The gallery" title="Five hacks that actually happen">
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {HACKS.map((h) => (
            <div key={h.title}>
              <h3 className="font-display font-semibold text-lg">
                <span className="mr-2 text-vermillion">✗</span>
                {h.title}
              </h3>
              <p className="prose-note mt-1">{h.mechanism}</p>
              <p className="mt-1.5 font-mono text-[0.7rem] text-moss-deep dark:text-moss">
                defense — {h.defense}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 the takeaway ──────────────────────────────────── */}
      <Section label="§ 4 · The whole lesson" title="A leash, a checker, and humility">
        <RuleCards
          items={[
            {
              rule: 'every reward is a proxy',
              why: 'And optimization pressure finds the gap — not because models are devious, but because the gap is where free reward lives.',
            },
            {
              rule: 'the KL term is a leash',
              tex: '-\\,\\beta\\,\\mathrm{KL}(\\pi \\| \\pi_{\\text{ref}})',
              why: "It doesn't repair the proxy; it limits how far pressure can push into the misspecified region. A tradeoff, not a decoration.",
            },
            {
              rule: 'separate worker and judge',
              why: "Self-preference is measured and real. A verifier with skin in the game can't be a fair verifier — in RLHF or in your own evals.",
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          Two defenses actually work: keep the policy near a reference (§2's leash), and make
          rewards <strong>verifiable</strong> where you can — that's the whole bet of GRPO/RLVR. But
          §3's unit-test gaming shows verifiable ≠ unhackable. Reward design is eval design under
          optimization pressure, which is why the next lab —{' '}
          <Link to="/learn/evals" className="link-ink">
            evaluation as a discipline
          </Link>{' '}
          — is the one the roadmap calls the most important in the phase.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '4' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 4 — post-train &amp; measure honestly →
          </Link>
          <Link to="/learn/preference-tuning" className="link-ink font-mono text-sm">
            sibling lab — preference methods
          </Link>
          <a
            href="https://arxiv.org/abs/2210.10760"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Gao et al. — RM overoptimization ↗
          </a>
          <a
            href="https://rlhfbook.com"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            The RLHF Book ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
