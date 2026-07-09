import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import { BlockWalkthrough } from '@/components/transformer-block/block-walkthrough'
import { MixVsThink } from '@/components/transformer-block/mix-vs-think'
import { NormLab } from '@/components/transformer-block/norm-lab'
import { ResidualStreamLab } from '@/components/transformer-block/residual-stream-lab'

export const Route = createFileRoute('/learn/transformer-block')({
  head: () => ({ meta: [{ title: 'The transformer block, interactively · Roadmap to Mastery' }] }),
  component: TransformerBlockPage,
})

function TransformerBlockPage() {
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
          The transformer block
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          A GPT is one unit repeated: attention, an MLP, two additions, two normalizations — stacked
          12, 48, 96 times. Attention (the previous lab) is the clever part;{' '}
          <strong>this page is about the plumbing that lets you stack it deep</strong> — the
          residual stream that carries information up, and the normalization that keeps every layer
          on stable footing. The plumbing looks boring. It's why any of this trains.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="x \leftarrow x + \text{Attn}(\text{LN}(x)) \qquad x \leftarrow x + \text{MLP}(\text{LN}(x))"
            className="text-[1.05rem] text-ink"
          />
          <span>— the whole block. two edits to a stream that flows through untouched.</span>
        </p>
      </div>

      {/* ── §1 residual stream ───────────────────────────────── */}
      <Section label="§ 1 · The backbone" title="Edit the stream, don't rewrite it">
        <p className="prose-note mb-8 max-w-2xl">
          Pretend each layer just multiplies the signal by a gain <strong>g</strong>. A bare
          48-layer stack applies g forty-eight times — exponential, so anything but g = 1.00
          vanishes or explodes (a straight line on this log plot). A residual layer instead{' '}
          <strong>adds a small edit to an untouched copy</strong>: the same imperfect g now barely
          dents the stream. Drag g away from 1 and watch the gap.
        </p>
        <ResidualStreamLab />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — a scalar caricature (real layers are matrices and the "edit" is damped here by
          0.1, like careful init); the honest part is the shape: multiplication compounds
          exponentially, addition doesn't. the same story holds for gradients flowing down.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 normalization ─────────────────────────────────── */}
      <Section label="§ 2 · Constant footing" title="Normalize before every branch">
        <p className="prose-note mb-8 max-w-2xl">
          The stream accumulates edits for 48 layers, so its scale drifts. Attention and MLP weights
          are tuned for inputs of a particular size — feed them something 6× larger and softmax
          saturates, gradients die. The fix: before each branch,{' '}
          <strong>reset the vector to a standard scale</strong>. Drag the drift sliders; the output
          barely moves.
        </p>
        <NormLab />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — one token's 6-dim slice of the stream, really normalized live. (production models
          add learned per-dim scale γ back after the reset — omitted here; it re-introduces scale on
          purpose, not by drift.)
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 attention vs mlp ──────────────────────────────── */}
      <Section label="§ 3 · Division of labor" title="Attention mixes, the MLP thinks">
        <p className="prose-note mb-8 max-w-2xl">
          The block has exactly two working parts, and they touch the tokens in opposite ways. Hover
          a row in either grid — same sentence as the attention lab:
        </p>
        <MixVsThink />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 assembled ─────────────────────────────────────── */}
      <Section label="§ 4 · Assembled" title="Walk the block, piece by piece">
        <p className="prose-note mb-8 max-w-2xl">
          Put the three ideas together and the block builds itself: normalize, mix, add — normalize,
          think, add. Step through and read <em>why</em> each piece is there:
        </p>
        <BlockWalkthrough />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §5 takeaway ──────────────────────────────────────── */}
      <Section label="§ 5 · The whole trick" title="Boring plumbing, deep networks">
        <RuleCards
          items={[
            {
              rule: "residual = edit, don't rewrite",
              tex: 'x \\leftarrow x + f(x)',
              why: 'Addition instead of replacement — signal and gradient ride an unbroken highway through 48 layers.',
            },
            {
              rule: 'norm = constant footing',
              tex: '\\hat{x} = \\frac{x - \\mu}{\\sigma}',
              why: 'However far the stream drifts, every branch receives unit-scale input. RMSNorm skips μ and nobody misses it.',
            },
            {
              rule: 'attention mixes, MLP thinks',
              tex: '\\text{cross-token} \\; / \\; \\text{per-token}',
              why: 'Information crosses positions only in attention; the MLP holds most of the parameters and does the per-token work.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          Stack N of these blocks between an embedding (words → vectors) and an unembedding (vectors
          → next-word logits) and you have the entire GPT architecture — there is no other secret
          ingredient. Which means you can now read{' '}
          <strong>nanoGPT's ~300 lines and recognize every one of them</strong> (frozen at its 2025
          deprecation — readable code doesn't rot; nanochat is the living successor). That's the
          next rep: build the block in PyTorch, from this page, without looking.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '2' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 2 — build a GPT from a blank file →
          </Link>
          <a
            href="https://www.youtube.com/watch?v=kCc8FmEb1nY"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Karpathy — Let's build GPT ↗
          </a>
          <a
            href="https://transformer-circuits.pub/2021/framework/index.html"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            the residual-stream framing (Anthropic) ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
