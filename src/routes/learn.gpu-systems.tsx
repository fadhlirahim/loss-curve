import { createFileRoute, Link } from '@tanstack/react-router'
import { FlashPlot } from '@/components/gpu-systems/flash-plot'
import { MemoryAnatomy } from '@/components/gpu-systems/memory-anatomy'
import { ParallelismCards } from '@/components/gpu-systems/parallelism-cards'
import { Roofline } from '@/components/gpu-systems/roofline'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/gpu-systems')({
  head: () => ({ meta: [{ title: 'GPU systems, interactively · Roadmap to Mastery' }] }),
  component: GpuSystemsPage,
})

function GpuSystemsPage() {
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
          Efficiency &amp; GPU systems
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          A training run is a budget of <strong>bytes moved and FLOPs spent</strong>, and every
          efficiency trick in the field is one of two moves: move fewer bytes, or waste fewer FLOPs.
          This page is the bookkeeping — where the memory actually goes, when the GPU computes
          versus waits, and what FlashAttention and parallelism really buy. Every number is computed
          from published formulas and H100 spec sheets.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="t_{op} = \max\!\left(\tfrac{\text{FLOPs}}{989\,\text{TF/s}},\; \tfrac{\text{bytes}}{3.35\,\text{TB/s}}\right)"
            className="text-[1.05rem] text-ink"
          />
          <span>— every op pays whichever bill is bigger. that's the whole chapter.</span>
        </p>
      </div>

      {/* ── §1 memory ────────────────────────────────────────── */}
      <Section label="§ 1 · Where the memory goes" title="The optimizer is the tenant">
        <p className="prose-note mb-8 max-w-2xl">
          Ask someone untrained where a 7B model's memory goes and they'll say "the weights." Wrong
          by 8×. AdamW mixed-precision training carries <strong>16 bytes per parameter</strong> —
          weights, gradients, fp32 master copies, and two Adam moments — before a single activation
          is stored. Slide the model size and watch which cards survive.
        </p>
        <MemoryAnatomy />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — shape derived from N ≈ 12·L·d² (d ≈ 128·L); activations use Megatron's
          no-recomputation estimate. real configs differ in detail, not in moral.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 roofline ──────────────────────────────────────── */}
      <Section label="§ 2 · Compute-bound or memory-bound" title="One plot decides">
        <p className="prose-note mb-8 max-w-2xl">
          For every operation, divide the arithmetic it does by the bytes it moves. That single
          number — <strong>arithmetic intensity</strong> — against the GPU's two ceilings (compute
          peak, memory bandwidth) tells you whether the silicon is working or waiting. Drag the
          matmul dimensions; find the ridge.
        </p>
        <Roofline />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — the roofline model. H100 SXM stated specs: 989 TFLOP/s dense bf16, 3.35 TB/s
          HBM3. everything left of the gold ridge is waiting on memory.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 flashattention ────────────────────────────────── */}
      <Section label="§ 3 · The FlashAttention idea" title="Fewer bytes, not fewer FLOPs">
        <p className="prose-note mb-8 max-w-2xl">
          Attention's score matrix is T×T. At long context that matrix — a temporary, used once —
          becomes the biggest thing on the card. FlashAttention's insight: it's a{' '}
          <strong>memory-bound op, so stop writing the matrix</strong>. Compute it in on-chip tiles,
          carry running softmax statistics, and never let the T² bytes touch HBM.
        </p>
        <FlashPlot />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 3 — one head, bf16. multiply by head count for the full bill; the shape of the
          argument doesn't change.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 parallelism ───────────────────────────────────── */}
      <Section label="§ 4 · Splitting the model" title="Three ways to cut a network">
        <p className="prose-note mb-8 max-w-2xl">
          When one GPU isn't enough, there are exactly three axes to cut along: the{' '}
          <strong>batch</strong>, the <strong>matmuls</strong>, or the <strong>depth</strong>. Each
          trades a different thing over the wire.
        </p>
        <ParallelismCards />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 takeaway ──────────────────────────────────────── */}
      <Section label="§ 5 · The whole chapter" title="Bytes and FLOPs, nothing else">
        <RuleCards
          items={[
            {
              rule: 'memory = optimizer states',
              tex: '16\\,\\text{B/param} \\gg 2\\,\\text{B/param}',
              why: 'Training carries 8× the memory of bf16 inference. ZeRO, offload, LoRA — all attacks on this line.',
            },
            {
              rule: 'intensity decides',
              tex: 'I = \\tfrac{\\text{FLOPs}}{\\text{bytes}} \\lessgtr 295',
              why: 'Below the ridge the GPU waits on HBM; above it, it computes. Big matmuls are the only citizens above.',
            },
            {
              rule: 'flash = fewer bytes',
              tex: 'O(T^2) \\to O(T)\\ \\text{traffic}',
              why: 'Same FLOPs, exact same answer. Speed came from traffic, not arithmetic — memorize this shape of win.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          When you profile your own training run in Phase 3 — and you should, that's the milestone —
          this page is the map you read the trace against: is the time in matmuls (fine), in
          memory-bound soup (fuse it), or in waiting on data (fix the loader)? For the real depth,
          CS336's systems assignments make you <em>build</em> the Triton kernel.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '3' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 3 — reproduce &amp; ablate →
          </Link>
          <Link to="/learn/scaling-laws" className="link-ink font-mono text-sm">
            sibling lab — scaling laws
          </Link>
          <a
            href="https://arxiv.org/abs/2205.14135"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            FlashAttention paper ↗
          </a>
          <a
            href="https://cs336.stanford.edu"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Stanford CS336 ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
