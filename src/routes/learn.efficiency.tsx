import { createFileRoute, Link } from '@tanstack/react-router'
import { DistillPanel } from '@/components/efficiency/distill-panel'
import { LEDGER } from '@/components/efficiency/model'
import { PruneLab } from '@/components/efficiency/prune-lab'
import { QuantLab } from '@/components/efficiency/quant-lab'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/efficiency')({
  head: () => ({
    meta: [{ title: 'The efficiency toolkit, interactively · Roadmap to Mastery' }],
  }),
  component: EfficiencyPage,
})

const METHOD_CARDS = [
  {
    name: 'GPTQ',
    note: 'Rounds weights one column at a time, compensating each rounding error with the weights not yet quantized. Smarter rounding, same grid.',
  },
  {
    name: 'AWQ',
    note: 'Protects the ~1% of channels the activations say matter most, scaling them out of harm before quantizing. Outlier-aware by design.',
  },
  {
    name: 'GGUF',
    note: 'Not an algorithm — the packaging: k-quant block formats plus metadata, so a quantized model is one portable file (llama.cpp).',
  },
]

function EfficiencyPage() {
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
          The small-models efficiency toolkit
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          Three ways to shrink a model: <strong>store it coarser</strong> (quantization),{' '}
          <strong>teach a smaller one</strong> (distillation), <strong>delete parts of it</strong>{' '}
          (pruning). None of them is magic — each is a measurable trade you can reason about, and
          all three are one-GPU research territory. Below, each runs for real on numbers small
          enough to read.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="\hat{w} = s \cdot \mathrm{round}(w / s), \quad s = \tfrac{\max|w|}{2^{b-1}-1}"
            className="text-[1.05rem] text-ink"
          />
          <span>— absmax quantization: one scale, everything snaps to a grid.</span>
        </p>
      </div>

      {/* ── §1 quantization ──────────────────────────────────── */}
      <Section label="§ 1 · Quantization" title="Precision is a budget, outliers set the price">
        <p className="prose-note mb-8 max-w-2xl">
          A weight is just a number stored at some precision. Drop from 16 bits to 4 and the model
          is 4× smaller — if the values survive the coarser grid. Turn the dials:{' '}
          <strong>then inject the outlier</strong> and watch per-tensor scaling fall apart. That
          single failure mode explains most of modern quantization research.
        </p>
        <QuantLab />
        <div className="mt-6 grid gap-5 sm:grid-cols-3">
          {METHOD_CARDS.map((m) => (
            <div key={m.name} className="border border-paper-edge bg-paper-deep/30 p-4">
              <h4 className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
                {m.name}
              </h4>
              <p className="mt-2 text-[0.83rem] text-ink-soft leading-relaxed">{m.note}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — 256 seeded Gaussian weights; the quantizer, the errors, and the outlier are all
          computed live. Real methods differ only in how cleverly they round onto this same grid.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 distillation ──────────────────────────────────── */}
      <Section label="§ 2 · Distillation" title="Soft targets carry more bits than labels">
        <p className="prose-note mb-8 max-w-2xl">
          A student trained on labels learns <em>the answer</em>. A student trained on the teacher's
          distribution learns <em>the answer, the runners-up, and the absurdities</em> — per token.
          Slide the temperature to see what the hard label throws away. This page shows what
          transfers; actually training a student on it is a Phase 3 project (how few teacher logits
          suffice? — the logit-sparsity study).
        </p>
        <DistillPanel />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 pruning ───────────────────────────────────────── */}
      <Section label="§ 3 · Pruning" title="Free memory, paid-for speed">
        <p className="prose-note mb-8 max-w-2xl">
          Most weights in a trained net are small, and small weights mostly don't matter — so zero
          them. The same seeded tensor, magnitude-pruned:{' '}
          <strong>watch the error stay flat, then cliff</strong>. Then switch to the 2:4 pattern to
          see the shape hardware actually rewards.
        </p>
        <PruneLab />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 ledger ────────────────────────────────────────── */}
      <Section label="§ 4 · The ledger" title="What a 1B model costs at each setting">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[38rem] border-collapse font-mono text-xs">
            <thead>
              <tr className="border-paper-edge border-b text-left text-[0.65rem] text-ink-faint uppercase tracking-widest">
                <th className="py-2 pr-4 font-medium">format</th>
                <th className="py-2 pr-4 font-medium">bits/weight</th>
                <th className="py-2 pr-4 font-medium">memory</th>
                <th className="py-2 pr-4 font-medium">decode speedup†</th>
                <th className="py-2 font-medium">what you risk</th>
              </tr>
            </thead>
            <tbody>
              {LEDGER.map((row) => (
                <tr key={row.format} className="border-paper-edge border-b">
                  <td className="py-2.5 pr-4 text-ink">{row.format}</td>
                  <td className="py-2.5 pr-4 text-ink tabular-nums">{row.bitsPerWeight}</td>
                  <td className="py-2.5 pr-4 text-ink tabular-nums">{row.memory}</td>
                  <td className="py-2.5 pr-4 text-ink tabular-nums">{row.speedup}</td>
                  <td className="py-2.5 text-ink-soft">{row.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 max-w-2xl font-mono text-[0.7rem] text-ink-faint">
          † rule of thumb: single-stream decode is memory-bandwidth-bound, so speedup ≈ compression
          ratio. *the sparse row additionally assumes 2:4-aware kernels; scales and indices add the
          overhead shown.
        </p>
        <p className="prose-note mt-6 max-w-2xl">
          This table is the Phase 3 deliverable in miniature: the{' '}
          <strong>quantization-quality ablation</strong> (same bits-per-weight across GPTQ / AWQ /
          GGUF, perplexity <em>and</em> a downstream suite) and the{' '}
          <strong>distillation logit-sparsity study</strong> are both this page turned into a real
          experiment — with seeds, baselines, and a writeup.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 takeaway ──────────────────────────────────────── */}
      <Section label="§ 5 · The whole toolkit" title="Three trades, all measurable">
        <RuleCards
          items={[
            {
              rule: 'precision is a budget',
              tex: 's = \\tfrac{\\max|w|}{2^{b-1}-1}',
              why: 'Outliers set the price: one weight can stretch the grid for all of them. Group the scales and the damage is contained.',
            },
            {
              rule: 'soft targets teach geometry',
              tex: 'p_i = \\tfrac{e^{z_i/T}}{\\sum_j e^{z_j/T}}',
              why: "The teacher's near-misses and absurdities carry bits the hard label doesn't have. That's the dark knowledge.",
            },
            {
              rule: 'sparsity needs hardware',
              tex: '2\\!:\\!4',
              why: 'Scattered zeros save memory, not time. Structure the zeros the way the silicon wants and the speedup becomes real.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          Every number on this page came from ~260 floats you can inspect. The real versions differ
          in scale, not in kind — which is exactly why this niche fits one GPU:{' '}
          <strong>measure the trade, publish the curve, repeat</strong>.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '3' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 3 — reproduce, then ablate →
          </Link>
          <a
            href="https://arxiv.org/abs/2210.17323"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            GPTQ ↗
          </a>
          <a
            href="https://arxiv.org/abs/2306.00978"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            AWQ ↗
          </a>
          <a
            href="https://arxiv.org/abs/1503.02531"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Hinton — distillation ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
