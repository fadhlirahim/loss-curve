import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { LOOP_ROWS } from '@/components/pipeline/model'
import { PromptLens } from '@/components/pipeline/prompt-lens'
import { StageMap } from '@/components/pipeline/stage-map'
import { Section } from '@/components/section'

export const Route = createFileRoute('/learn/pipeline')({
  head: () => ({ meta: [{ title: 'The full pipeline, interactively · Roadmap to Mastery' }] }),
  component: PipelinePage,
})

function PipelinePage() {
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
          The full pipeline
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          A chat model is not trained in one go. Raw web text goes in one end and something that
          answers questions comes out the other — through stages that all reuse{' '}
          <strong>one training loop with different data</strong>. Below is the whole shape at
          nanochat speedrun scale (≈$100, ~4 hours, 8×H100): small numbers, real proportions. Seeing
          it once, end to end, is the point — Phases 3–4 then deepen each part.
        </p>
        <p className="rise rise-3 mt-4 font-mono text-[0.75rem] text-ink-faint">
          web text → <span className="text-ink">base</span> → (+ domain) →{' '}
          <span className="text-ink">chat</span> →{' '}
          <span className="text-ink">a number you can trust</span>
        </p>
      </div>

      {/* ── §1 the map ───────────────────────────────────────── */}
      <Section label="§ 1 · The map" title="Four stages, one loop">
        <p className="prose-note mb-8 max-w-2xl">
          Each card is a stage; the chips show what the artifact <em>is</em> after it runs — watch
          the model card change identity along the flow. <strong>Click a stage</strong> to unpack
          what goes in, what the objective is, what comes out, and what breaks if you skip it.
        </p>
        <StageMap />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — costs are nanochat speedrun ballpark (≈$100 total). the proportions are the
          lesson: knowledge is expensive, behavior is cheap, measurement is almost free.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 one prompt, four behaviors ────────────────────── */}
      <Section label="§ 2 · The behavior" title="Same prompt, every stage">
        <p className="prose-note mb-8 max-w-2xl">
          The clearest way to feel what each stage does is to ask the <em>same question</em> after
          each one. A base model <strong>continues</strong> your text; only after SFT does it{' '}
          <strong>answer</strong> — and only eval tells you whether any of it actually works.
        </p>
        <PromptLens />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — outputs are illustrative, hand-written for this page to show each stage's
          characteristic behavior; they are not sampled from a real model.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 same loop, different data ─────────────────────── */}
      <Section label="§ 3 · The loop" title="The loop is the same. The data isn't.">
        <p className="prose-note mb-8 max-w-2xl">
          Strip away the names and every training stage is the identical next-token loop — what
          changes is what the batches contain, how many tokens flow through, and how hard the
          optimizer pushes. <strong>Data is the steering wheel.</strong>
        </p>
        <div className="overflow-x-auto border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
          <table className="w-full min-w-[36rem] border-collapse font-mono text-[0.75rem]">
            <thead>
              <tr className="text-left">
                {['stage', 'tokens seen', 'epochs', 'learning rate', 'what a "step" is'].map(
                  (h) => (
                    <th
                      key={h}
                      className="border-paper-edge border-b pr-4 pb-2 font-medium text-[0.65rem] text-vermillion uppercase tracking-widest"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {LOOP_ROWS.map((row) => (
                <tr key={row.stage} className="align-top">
                  <td className="border-paper-edge border-b py-2.5 pr-4 text-ink">{row.stage}</td>
                  <td className="border-paper-edge border-b py-2.5 pr-4 text-ink-soft tabular-nums">
                    {row.tokens}
                  </td>
                  <td className="border-paper-edge border-b py-2.5 pr-4 text-ink-soft tabular-nums">
                    {row.epochs}
                  </td>
                  <td className="border-paper-edge border-b py-2.5 pr-4 text-ink-soft">{row.lr}</td>
                  <td className="border-paper-edge border-b py-2.5 text-ink-soft">{row.step}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="prose-note mt-8 max-w-2xl">
          This split is exactly how the roadmap divides the next two phases:{' '}
          <strong>Phase 3</strong> lives inside pretraining's constraints (data quality, scaling,
          GPU systems), and <strong>Phase 4</strong> lives after it (post-training and evaluation).
          The pipeline isn't just how models are built — it's the curriculum's table of contents.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 the takeaway ──────────────────────────────────── */}
      <Section label="§ 4 · The takeaway" title="The shape to remember">
        <RuleCards
          items={[
            {
              rule: 'one loop, different data',
              why: 'Pretrain, mid-train and SFT run the same next-token loop. The stages differ in what the batches contain — data is the steering wheel.',
            },
            {
              rule: 'SFT changes behavior, not knowledge',
              why: 'The facts live in pretraining. SFT teaches the move "a question is followed by an answer" — small, cheap, and transformative.',
            },
            {
              rule: 'eval is a stage, not an afterthought',
              why: 'It has its own data and its own discipline, and it is the only stage whose output you can defend. Phase 4 lives here.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          The Phase 2 milestone is running this shape <strong>once, yourself</strong> — tokenizer to
          chat UI — so that none of it is folklore. nanochat is the speedrun: a weak model, a
          complete pipeline, and every stage of this page made concrete.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '2' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 2 — run the pipeline yourself →
          </Link>
          <a
            href="https://github.com/karpathy/nanochat"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Karpathy — nanochat ↗
          </a>
          <a
            href="https://github.com/rasbt/LLMs-from-scratch"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Raschka — LLMs from scratch ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
