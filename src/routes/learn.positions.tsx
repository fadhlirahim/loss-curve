import { createFileRoute, Link } from '@tanstack/react-router'
import { RuleCards } from '@/components/lab/cards'
import { LearnedPanel } from '@/components/positions/learned-panel'
import { RopeCircle } from '@/components/positions/rope-circle'
import { ShuffleDemo } from '@/components/positions/shuffle-demo'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'

export const Route = createFileRoute('/learn/positions')({
  head: () => ({ meta: [{ title: 'Positional information, interactively · Roadmap to Mastery' }] }),
  component: PositionsPage,
})

function PositionsPage() {
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
          Positional information
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          The{' '}
          <Link to="/learn/attention" className="link-ink">
            attention lab
          </Link>{' '}
          ended on a confession: nothing in QKᵀ knows where a word <em>sits</em>. Attention is a{' '}
          <strong>bag of words</strong> — shuffle the sentence and every score survives. Two fixes
          exist: bolt a position vector onto each embedding (<strong>learned absolute</strong>), or
          rotate position into the geometry of every query and key (<strong>RoPE</strong>). Both run
          live below.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="(R_i\,q)\cdot(R_j\,k) \;=\; q^{\top} R_{\,j-i}\,k"
            className="text-[1.05rem] text-ink"
          />
          <span>— rotate both, and only the offset survives. That one identity is RoPE.</span>
        </p>
      </div>

      {/* ── §1 the blindness ─────────────────────────────────── */}
      <Section label="§ 1 · The blindness" title="Shuffle the sentence, keep every score">
        <p className="prose-note mb-8 max-w-2xl">
          These are the real scores from the attention lab's sentence. Shuffle the words and watch
          the matrix: every cell keeps its exact value — it just moves house with its tokens. The
          outlined cell tracks <strong>q(it)·k(bird)</strong> through each shuffle.
        </p>
        <ShuffleDemo />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — a dot product sees vectors, not addresses. word order must be smuggled into the
          vectors themselves.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §2 learned positions ─────────────────────────────── */}
      <Section label="§ 2 · Fix 1 — learned positions" title="A trainable vector per slot">
        <p className="prose-note mb-8 max-w-2xl">
          The GPT-2 way: keep a table of one trainable vector per position and <strong>add</strong>{' '}
          it to the token embedding before the first layer. Position and content share the same
          channels — the network learns to read both out of the sum. It works, with one built-in
          cliff: <em>the table only has rows for positions it saw in training</em>. Slide past the
          edge.
        </p>
        <LearnedPanel />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — position vectors hand-crafted on four legible channels; real models learn
          hundreds of unlabeled ones.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §3 rope ──────────────────────────────────────────── */}
      <Section label="§ 3 · Fix 2 — RoPE" title="Rotate the pair, keep the angle">
        <p className="prose-note mb-8 max-w-2xl">
          Rotary embeddings skip the table. Inside every attention call, rotate each query by{' '}
          <em>its position × θ</em> and each key by <em>its position × θ</em>. A dot product only
          measures the angle between two vectors — and rotating both by position makes that angle
          depend on <strong>the offset alone</strong>. Slide i and j, then lock the offset and slide
          the pair.
        </p>
        <RopeCircle />
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 3 — genuine 2-d rotations, computed live. real heads rotate d/2 such pairs at once,
          each with its own frequency.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── §4 the takeaway ──────────────────────────────────── */}
      <Section label="§ 4 · Why relative wins" title="Absolute memorizes; relative generalizes">
        <div className="mb-10 grid gap-5 sm:grid-cols-2">
          <div className="border border-paper-edge bg-paper-deep/30 p-5">
            <h3 className="font-display font-semibold">learned absolute</h3>
            <ul className="mt-3 space-y-2 font-mono text-[0.78rem] text-ink-soft leading-relaxed">
              <li>· lives in the embedding — added once, before layer 1</li>
              <li>· knows "slot 7", not "three words back"</li>
              <li>· past trained length: untrained noise, no graceful decay</li>
            </ul>
          </div>
          <div className="border border-paper-edge bg-paper-deep/30 p-5">
            <h3 className="font-display font-semibold">RoPE — rotary</h3>
            <ul className="mt-3 space-y-2 font-mono text-[0.78rem] text-ink-soft leading-relaxed">
              <li>· lives inside every attention call, applied to q and k</li>
              <li>· q·k depends only on i − j — relative by construction</li>
              <li>· extrapolates further, and stretches further still (context scaling)</li>
            </ul>
          </div>
        </div>
        <RuleCards
          items={[
            {
              rule: 'attention is permutation-blind',
              tex: 's_{ij} = q_i \\cdot k_j',
              why: 'No subscript arithmetic anywhere — shuffle the words and every score follows its tokens.',
            },
            {
              rule: 'absolute positions memorize slots',
              tex: 'x_p = e_{\\text{tok}} + p_{\\text{pos}[p]}',
              why: 'A lookup table over training positions. Ask for a row it never learned and you get init noise.',
            },
            {
              rule: 'RoPE makes q·k a function of distance',
              tex: '(R_i q)\\cdot(R_j k) = q^{\\top}R_{j-i}k',
              why: 'Rotate both sides and absolute position cancels. Distance is all that reaches the softmax.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          This closes the attention lab's open loop — the transformer now knows <em>what</em> to
          look at and <em>where</em> things are. The milestone question "why does self-attention
          need positional information, and how does RoPE provide it?" should now feel almost
          unfairly easy:{' '}
          <strong>
            because a dot product has no address book, and RoPE hides the address in the angle
          </strong>
          .
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '2' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 2 — build a GPT from a blank file →
          </Link>
          <Link to="/learn/attention" className="link-ink font-mono text-sm">
            prerequisite: the attention lab
          </Link>
          <a
            href="https://arxiv.org/abs/2104.09864"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            RoFormer (the RoPE paper) ↗
          </a>
          <a
            href="https://blog.eleuther.ai/rotary-embeddings/"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            EleutherAI — rotary embeddings ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
