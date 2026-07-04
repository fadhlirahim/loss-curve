import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { ChatTemplate } from '@/components/sft/chat-template'
import { CostTable } from '@/components/sft/cost-table'
import { LoraLab } from '@/components/sft/lora-lab'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/sft')({
  head: () => ({ meta: [{ title: 'SFT & LoRA, interactively · Roadmap to Mastery' }] }),
  component: SftPage,
})

function SftPage() {
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
          SFT &amp; LoRA
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          A base model is a text-completer with no concept of being asked. Supervised fine-tuning is{' '}
          <strong>just more pretraining — on transcripts of the behavior you want</strong>. No new
          algorithm, no reward signal: the same next-token loss, pointed at conversations. The craft
          lives in two places: what you put in the dataset, and how you afford the gradient on one
          GPU.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex tex="W' = W + \Delta W \approx W + BA" className="text-[1.05rem] text-ink" />
          <span>— LoRA's whole bet: the update ΔW is low-rank, so train B and A instead.</span>
        </p>
      </div>

      {/* ── §1 the data ──────────────────────────────────────── */}
      <Section label="§ 1 · The data IS the method" title="Train only the answer">
        <p className="prose-note mb-8 max-w-2xl">
          Every SFT example is rendered into a <strong>chat template</strong> before the model sees
          it. Two decisions hide in that rendering: the format itself, and the{' '}
          <strong>loss mask</strong> — which tokens carry gradient. Flip the mask below; then try
          the other training pairs, because the second lesson is harsher:{' '}
          <em>whatever is in the response, masked or not, becomes the model's personality.</em>
        </p>
        <ChatTemplate />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — chunks are word-level for legibility; a real tokenizer cuts finer (see the
          tokenizer lab).
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 lora ──────────────────────────────────────────── */}
      <Section label="§ 2 · LoRA" title="The update is low-rank">
        <p className="prose-note mb-8 max-w-2xl">
          Fine-tuning changes W by some ΔW. LoRA's empirical bet:{' '}
          <strong>ΔW has low intrinsic rank</strong> — a handful of directions do almost all the
          work. Below, a 16×16 update built from six directions of decaying strength (plus noise):
          drag the rank and watch how little of the matrix you need to train to capture almost all
          of it.
        </p>
        <LoraLab />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — constructed from orthonormal directions, so the rank-r truncation is exactly
          optimal (Eckart–Young) and the energy curve is exact. Real updates aren't built this
          cleanly — the LoRA paper's evidence is that they behave as if they were. vermillion =
          positive, moss = negative.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 cost ──────────────────────────────────────────── */}
      <Section label="§ 3 · What it costs" title="Why LoRA exists: the optimizer bill">
        <p className="prose-note mb-8 max-w-2xl">
          Training memory is dominated by{' '}
          <strong>optimizer states — 16 bytes per trained param</strong> under AdamW mixed
          precision. Freeze the base and train only adapters, and that bill collapses; quantize the
          frozen base to 4-bit (QLoRA) and the weights nearly vanish too.
        </p>
        <CostTable />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 limits ────────────────────────────────────────── */}
      <Section label="§ 4 · Honest limits" title="What SFT can and can't do">
        <RuleCards
          items={[
            {
              rule: 'It changes behavior, cheaply',
              why: 'Format, persona, instruction-following, refusal style — thousands of good pairs move all of them. This is the highest-leverage cheap intervention in the pipeline.',
            },
            {
              rule: "It doesn't add knowledge reliably",
              why: "Facts the base model never learned don't appear because you showed it 3k transcripts. Knowledge is pretraining's job; SFT mostly reshapes what's already there.",
            },
            {
              rule: 'It overcooks easily',
              why: 'Too many epochs on a narrow set and the model collapses into one voice and forgets base abilities — practitioner lore you will reproduce within your first week of trying.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          For the base-vs-SFT behavior shift on one prompt, see the{' '}
          <Link to="/learn/pipeline" className="link-ink">
            pipeline lab's §2
          </Link>{' '}
          — same model lineage, completely different creature after a few thousand transcripts.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 takeaway ──────────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Three rules, one bet">
        <RuleCards
          items={[
            {
              rule: 'SFT is pretraining on the behavior you want',
              why: 'Same loss, same loop — the dataset is the entire specification of the assistant.',
            },
            {
              rule: 'Mask the prompt, train the answer',
              why: 'Gradient on the response (and its end marker). Context is for reading, not imitating.',
            },
            {
              rule: 'LoRA bets the update is low-rank',
              why: 'Train 2dr params instead of d². The bet usually pays; the optimizer bill collapses.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          The Phase 4 deliverable starts exactly here:{' '}
          <strong>LoRA-SFT a 0.5–1.5B model on a focused dataset with TRL</strong>, then evaluate it
          honestly — which is the hard half, and the next lab.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '4' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 4 — post-train &amp; measure honestly →
          </Link>
          <a
            href="https://arxiv.org/abs/2106.09685"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            LoRA paper ↗
          </a>
          <a
            href="https://huggingface.co/docs/trl/sft_trainer"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            TRL SFT trainer ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
