import { createFileRoute, Link } from '@tanstack/react-router'
import { ContaminationScan } from '@/components/evals/contamination-scan'
import { FormatFlip } from '@/components/evals/format-flip'
import { GraderLab } from '@/components/evals/grader-lab'
import { NoiseFloor } from '@/components/evals/noise-floor'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/evals')({
  head: () => ({
    meta: [{ title: 'Evaluation as a discipline, interactively · Roadmap to Mastery' }],
  }),
  component: EvalsPage,
})

const CHECKLIST = [
  'Error bars or at least N stated — a score without a denominator is a vibe.',
  'Grader code published — the grader is part of the model being measured.',
  'Decontamination protocol stated — n-gram scan against the training corpus.',
  'Prompt-sensitivity checked — same eval under ≥2 formats, spread reported.',
  'Same-size baseline included — beating nothing proves nothing.',
  'Decoding parameters reported — temperature and sampling change the score.',
]

function EvalsPage() {
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
          Evaluation as a discipline
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          The roadmap calls evaluation{' '}
          <strong>the single most under-respected skill in the field</strong> — and the recurring
          source of "results" that turn out to be measurement artifacts. The working posture:{' '}
          <em>assume your eval is lying until you've checked how.</em> Below are the four most
          common lies, each one computable enough to demonstrate live.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="\hat{p} = p \pm 1.96\sqrt{\tfrac{p(1-p)}{N}}"
            className="text-[1.05rem] text-ink"
          />
          <span>— every benchmark score ships with a noise floor, whether reported or not.</span>
        </p>
      </div>

      {/* ── §1 noise ─────────────────────────────────────────── */}
      <Section label="§ 1 · Lie #1 — the noise floor" title="A score is a sample, not a truth">
        <p className="prose-note mb-8 max-w-2xl">
          An eval run is a coin-flip experiment: N questions, some probability p of getting each
          right. Below, both models' runs are <strong>real seeded binomial draws</strong>, and the
          shaded band is the analytic 95% interval. Shrink N and watch two genuinely different
          models become indistinguishable; re-run the eval and watch the "winner" change.
        </p>
        <NoiseFloor />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — 20 runs per model, real binomial sampling; the ranking probability uses the
          normal approximation. Rule of thumb before you celebrate: is the gap bigger than the band?
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 grader ────────────────────────────────────────── */}
      <Section label="§ 2 · Lie #2 — the grader" title="The grader is part of the model">
        <p className="prose-note mb-8 max-w-2xl">
          Ten fixed answers, four grading functions — all four <strong>actually run</strong> on this
          page. Exact match robs correct answers; the lenient grader credits a wrong one (watch the
          vermillion card when you pick <em>contains-answer</em>). The score swings 4× with zero
          change to the model.
        </p>
        <GraderLab />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 contamination ─────────────────────────────────── */}
      <Section label="§ 3 · Lie #3 — contamination" title="The test set is on the web">
        <p className="prose-note mb-8 max-w-2xl">
          A real n-gram scan, the same technique production pipelines use: every benchmark item is
          checked for <strong>3-gram containment</strong> against the training corpus. Three items
          leak in through a quiz blog and a forum post — the model "solves" everything it memorized,
          and the reported score inflates accordingly.
        </p>
        <ContaminationScan />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — containment, not symmetric similarity: corpus documents are much longer than
          benchmark items, so the honest question is "what fraction of this item appears in the
          doc."
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 prompt ────────────────────────────────────────── */}
      <Section label="§ 4 · Lie #4 — the prompt" title="The ranking depends on the template">
        <p className="prose-note mb-8 max-w-2xl">
          The same two models, the same questions, five ways of asking. Model A wins three formats
          and loses two — <strong>the leaderboard order is a property of the prompt</strong>, not
          just the models. The per-format numbers here are hand-set illustrations of a measured
          phenomenon (MMLU-style format sensitivity); the flip is the point.
        </p>
        <FormatFlip />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 checklist ─────────────────────────────────────── */}
      <Section label="§ 5 · The discipline" title="The honest-eval checklist">
        <p className="prose-note mb-8 max-w-2xl">
          Phase 4's milestone asks you to <strong>critique a published paper's evaluation</strong>.
          This is the checklist to critique it with — and the one your own Phase 4 project must
          survive:
        </p>
        <ul className="max-w-2xl space-y-3">
          {CHECKLIST.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span className="mt-1 h-4 w-4 flex-none border-[1.5px] border-ink-faint bg-paper-bright" />
              <span className="text-[0.98rem] text-ink-soft leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-10">
          <RuleCards
            items={[
              {
                rule: 'a score is a sample',
                tex: '\\pm 1.96\\sqrt{p(1-p)/N}',
                why: 'The noise floor exists whether you report it or not. Gaps smaller than the band are coin flips.',
              },
              {
                rule: 'the grader is the model',
                why: 'Exact match, normalization, tolerance — each is a different benchmark wearing the same name. Publish the grader.',
              },
              {
                rule: 'report the spread, not the max',
                why: 'Across seeds, prompts, and graders you get a distribution. Quoting its maximum is how measurement artifacts become "results".',
              },
            ]}
          />
        </div>
        <p className="prose-note mt-8 max-w-2xl">
          Everything on this page compounds into every later project: the reproduction ablations of
          Phase 3, the post-training project of Phase 4, and the original result of Phase 5 all live
          or die by whether the measurement can be trusted.
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
          <Link to="/learn/sampling" className="link-ink font-mono text-sm">
            sibling lab — why decoding changes scores
          </Link>
        </div>
      </Section>
    </main>
  )
}
