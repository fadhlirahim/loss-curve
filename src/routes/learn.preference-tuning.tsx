import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { BtPanel } from '@/components/preference-tuning/bt-panel'
import { DpoPanel } from '@/components/preference-tuning/dpo-panel'
import { FamilyCards } from '@/components/preference-tuning/family-cards'
import { GrpoPanel } from '@/components/preference-tuning/grpo-panel'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/preference-tuning')({
  head: () => ({
    meta: [{ title: 'RLHF, DPO, GRPO, interactively · Roadmap to Mastery' }],
  }),
  component: PreferenceTuningPage,
})

function PreferenceTuningPage() {
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
          RLHF, DPO, GRPO
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          SFT shows the model what good looks like; preference methods teach it what{' '}
          <strong>better</strong> looks like. Three recipes dominate, and they share one idea:{' '}
          <strong>turn a comparison into a gradient</strong>. Every panel below computes the real
          loss functions on numbers small enough to read — no training run required to see how each
          method thinks.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="L_{\text{DPO}} = -\log \sigma\!\left(\beta\left[\log\tfrac{\pi(y_w)}{\pi_{\text{ref}}(y_w)} - \log\tfrac{\pi(y_l)}{\pi_{\text{ref}}(y_l)}\right]\right)"
            className="text-[1rem] text-ink"
          />
          <span>— one pair, one sigmoid, no reward model.</span>
        </p>
      </div>

      {/* ── §1 bradley–terry ─────────────────────────────────── */}
      <Section label="§ 1 · The atom" title="A preference is a probability">
        <p className="prose-note mb-8 max-w-2xl">
          Nobody can write down "this answer is worth 7.3 points" — but anyone can say{' '}
          <em>which of two answers they prefer</em>. The Bradley–Terry model turns those comparisons
          into a scale: the bigger the reward gap, the more confidently the comparison should go one
          way. Drag the gap and watch the probability.
        </p>
        <BtPanel />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 dpo ───────────────────────────────────────────── */}
      <Section label="§ 2 · DPO" title="Skip the reward model">
        <p className="prose-note mb-8 max-w-2xl">
          DPO's trick: the policy itself <em>is</em> the reward model. Define each response's
          implicit reward as β times how far the policy has drifted from the reference on that
          response — then push the chosen response's reward above the rejected one's, through the
          same sigmoid as §1. Every term is live below.
        </p>
        <DpoPanel />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — the dashed line is ln 2, the loss on a pair the policy has no opinion about.
          Whatever β you pick, the curve passes through it at margin 0.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 grpo ──────────────────────────────────────────── */}
      <Section label="§ 3 · GRPO" title="The group is the baseline">
        <p className="prose-note mb-8 max-w-2xl">
          GRPO samples a <strong>group</strong> of attempts at the same prompt, scores each with a
          programmatic checker (right answer = 1, wrong = 0), and normalizes within the group:
          advantage = (reward − group mean) / group std. No value network, no reward model — the
          other attempts are the baseline. Toggle the checkmarks and watch the advantages rebalance;
          then make them all correct.
        </p>
        <GrpoPanel />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 the family ────────────────────────────────────── */}
      <Section label="§ 4 · The family" title="Three recipes, honestly compared">
        <FamilyCards />
        <p className="prose-note mt-8 max-w-2xl">
          The roadmap's ordering advice stands:{' '}
          <strong>SFT + DPO is the safe first post-training project</strong> — offline data, one
          frozen reference, failures you can debug. GRPO is the exciting frontier <em>and</em> a
          debugging swamp (KL control, reward hacking, vLLM colocation, wall-clock ≫ GPU-hours) —
          earn it second. The{' '}
          <a href="https://rlhfbook.com" target="_blank" rel="noreferrer" className="link-ink">
            RLHF Book
          </a>{' '}
          is the spine for all of this.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 takeaway ──────────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Comparisons all the way down">
        <RuleCards
          items={[
            {
              rule: 'a comparison is a gradient',
              tex: 'P(y_w \\succ y_l) = \\sigma(r_w - r_l)',
              why: 'Bradley–Terry turns "this one is better" into a differentiable target. Everything else is plumbing.',
            },
            {
              rule: "DPO's reward is implicit",
              tex: 'r(y) = \\beta \\log \\tfrac{\\pi(y)}{\\pi_{\\text{ref}}(y)}',
              why: 'Distance from the reference IS the reward. β sets how long the leash is.',
            },
            {
              rule: 'uniform groups teach nothing',
              tex: 'A_i = \\tfrac{r_i - \\bar{r}}{\\text{std}(r)}',
              why: "GRPO's baseline is the group mean — all-right or all-wrong prompts produce zero gradient.",
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          The Phase 4 deliverable applies this page: SFT a small model, then run DPO on a focused
          preference set — and put your real effort into the <strong>evaluation</strong>, because
          the reward you optimize is never quite the quality you meant.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '4' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 4 — post-train &amp; measure honestly →
          </Link>
          <Link to="/learn/reward-hacking" className="link-ink font-mono text-sm">
            sibling lab — reward hacking
          </Link>
          <a
            href="https://arxiv.org/abs/2305.18290"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            DPO paper ↗
          </a>
          <a
            href="https://arxiv.org/abs/2501.12948"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            DeepSeek-R1 ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
