import { createFileRoute, Link } from '@tanstack/react-router'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import type { LearnRoute } from '@/data/roadmap'

export const Route = createFileRoute('/learn/math')({
  head: () => ({ meta: [{ title: 'Math, just-in-time · Roadmap to Mastery' }] }),
  component: MathPage,
})

type Entry = {
  concept: string
  tex: string
  plain: string
  feltIn: { to: LearnRoute; label: string }
}

type Ledger = { area: string; book: string; entries: Entry[] }

const LEDGER: Ledger[] = [
  {
    area: 'Calculus',
    book: 'MML ch. 5 · 3Blue1Brown "Essence of Calculus"',
    entries: [
      {
        concept: 'derivative = local slope',
        tex: "f'(x) \\approx \\frac{f(x+\\varepsilon) - f(x)}{\\varepsilon}",
        plain:
          "How much the output wiggles per unit of input wiggle, at the point where you're standing. Not a formula to memorize — a question to ask.",
        feltIn: { to: '/learn/backprop', label: 'backprop §2 — the tangent on the loss curve' },
      },
      {
        concept: 'partial derivative',
        tex: '\\frac{\\partial L}{\\partial a}',
        plain:
          'The same question with every other dial frozen. A billion-parameter model is just a billion of these, one per dial.',
        feltIn: { to: '/learn/backprop', label: 'backprop §2 — "freeze every dial except a"' },
      },
      {
        concept: 'the chain rule',
        tex: '\\frac{\\partial L}{\\partial a} = \\frac{\\partial L}{\\partial u} \\cdot \\frac{\\partial u}{\\partial a}',
        plain:
          'Effects multiply through a pipeline: if a moves u and u moves L, then a moves L by the product. Backprop is this rule applied backward, once per node.',
        feltIn: { to: '/learn/backprop', label: 'backprop §1 — every step of the ticker' },
      },
      {
        concept: 'the gradient',
        tex: '\\nabla L = \\left(\\tfrac{\\partial L}{\\partial w_1}, \\ldots, \\tfrac{\\partial L}{\\partial w_n}\\right)',
        plain:
          'All the partials stacked into one arrow that points uphill. Training is walking against it.',
        feltIn: { to: '/learn/gradient-descent', label: 'gradient descent §1 — the step rule' },
      },
      {
        concept: 'local linear approximation',
        tex: '\\Delta L \\approx \\nabla L \\cdot \\varepsilon',
        plain:
          "The tangent's promise: valid near your point, breaking as you stray. This is why learning rates must be small, and why one giant step fails.",
        feltIn: {
          to: '/learn/backprop',
          label: 'backprop §2 — the nudge that drifts off the curve',
        },
      },
    ],
  },
  {
    area: 'Linear algebra',
    book: 'MML ch. 2–4 · 3Blue1Brown "Essence of Linear Algebra"',
    entries: [
      {
        concept: 'matrix × vector = mixing',
        tex: 'a^{(l)} = W a^{(l-1)} + b',
        plain:
          'Each output is a weighted blend of all the inputs — a matrix is a recipe book of blends. A layer is exactly this, plus a bend.',
        feltIn: { to: '/learn/neural-net', label: 'neural net — the layer formula in the hero' },
      },
      {
        concept: 'matrix products collapse',
        tex: 'W^{(2)} W^{(1)} = W',
        plain:
          'Two mixes in a row are one mix. This is a theorem AND a design warning: without nonlinearities, depth buys nothing.',
        feltIn: { to: '/learn/neural-net', label: 'neural net §3 — "activations bend"' },
      },
      {
        concept: 'the transpose runs it backward',
        tex: '\\delta^{(l-1)} = W^{\\top} \\delta^{(l)}',
        plain:
          'The same mixer, driven in reverse, routes blame from outputs back to inputs. Forward mixes values; backward mixes gradients.',
        feltIn: { to: '/learn/backprop', label: 'backprop §1 — blame flowing right to left' },
      },
      {
        concept: 'curvature has directions',
        tex: 'L = \\tfrac{1}{2}(x^2 + \\kappa y^2)',
        plain:
          "A bowl can be 40× steeper one way than another (those steepnesses are the eigenvalues you'll meet later). Conditioning is why optimizers exist.",
        feltIn: { to: '/learn/gradient-descent', label: 'gradient descent §2 — the ravine' },
      },
    ],
  },
  {
    area: 'Probability',
    book: 'MML ch. 6 · the glossary, for now',
    entries: [
      {
        concept: 'a probability as output',
        tex: '\\sigma(z) = \\frac{1}{1 + e^{-z}} \\in (0, 1)',
        plain:
          'The net doesn\'t answer "class 1" — it answers "0.83 sure." Squashing a raw score into (0,1) is what lets a loss price confidence.',
        feltIn: { to: '/learn/neural-net', label: 'neural net — the tint of every grid cell' },
      },
      {
        concept: 'negative log-likelihood',
        tex: 'L = -\\log p_{\\text{truth}}',
        plain:
          'Score a prediction by the probability it gave reality, then take −log so confident wrongness explodes. Cross-entropy is this, averaged.',
        feltIn: { to: '/learn/core-ml', label: 'core ml §1 — the price of confidence' },
      },
      {
        concept: 'expectation = average',
        tex: 'L = \\tfrac{1}{n} \\sum_i L_i',
        plain:
          'Every loss you watched was a mean over examples — an estimate of the true average over all possible data. Train/val is two estimates of it.',
        feltIn: { to: '/learn/core-ml', label: 'core ml §2 — homework vs exam' },
      },
      {
        concept: 'entropy of a coin flip',
        tex: '-\\log \\tfrac{1}{2} = \\ln 2 \\approx 0.69',
        plain:
          'The loss of pure ignorance on a binary task. Every untrained net starts here; a loss stuck here means nothing was learned.',
        feltIn: { to: '/learn/core-ml', label: 'core ml — the dashed coin-flip line' },
      },
      {
        concept: 'randomness needs seeds',
        tex: 'W \\sim \\mathcal{N}(0, \\tfrac{1}{n_{\\text{in}}})',
        plain:
          'Init and data are draws from distributions — so a single run is a single sample, and a "result" from one seed might be luck. (This becomes "≥3 seeds" in research method.)',
        feltIn: { to: '/learn/neural-net', label: 'neural net — the re-roll ⚄ button' },
      },
    ],
  },
]

function MathPage() {
  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">
          Reference, not curriculum ·{' '}
          <Link to="/phases/$phaseId" params={{ phaseId: '1' }} className="hover:underline">
            Phase 1 — Foundations
          </Link>
        </p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Math, just-in-time
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          This topic deliberately gets <strong>a ledger, not a simulator</strong> — because the
          roadmap's rule is that you never study math ahead of need. The trick: you've already used
          every concept below. The four labs smuggled them in. What follows is the receipt — each
          idea named, typeset, and linked back to the moment you <em>felt</em> it.
        </p>
        <blockquote className="rise rise-3 mt-8 max-w-2xl border-vermillion border-l-2 pl-5 font-display text-ink-soft text-lg italic leading-relaxed">
          Math-first paralysis is the #1 way strong engineers waste months. You don't finish a
          linear algebra course; you raid one, with a specific question, then get back to the build.
        </blockquote>
      </div>

      {/* ── the ledger ───────────────────────────────────────── */}
      <Section label="§ 1 · The ledger" title="Math you already did">
        <div className="space-y-14">
          {LEDGER.map((group) => (
            <div key={group.area}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display font-semibold text-2xl">{group.area}</h3>
                <p className="font-mono text-[0.68rem] text-ink-faint">raid: {group.book}</p>
              </div>
              <dl className="mt-4">
                {LEDGER.length > 0 &&
                  group.entries.map((e) => (
                    <div
                      key={e.concept}
                      className="grid gap-x-8 gap-y-2 border-paper-edge border-t py-5 sm:grid-cols-[15rem_1fr]"
                    >
                      <dt>
                        <p className="font-display font-semibold leading-snug">{e.concept}</p>
                        <Tex block tex={e.tex} className="mt-2 text-[0.85rem] text-ink" />
                      </dt>
                      <dd className="text-[0.98rem] text-ink-soft leading-relaxed">
                        {e.plain}
                        <Link
                          to={e.feltIn.to}
                          className="mt-2 block font-mono text-[0.7rem] text-vermillion hover:underline"
                        >
                          you felt it: {e.feltIn.label} →
                        </Link>
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── the protocol ─────────────────────────────────────── */}
      <Section label="§ 2 · The protocol" title="How to raid a reference">
        <ol className="max-w-2xl space-y-5">
          {[
            [
              'Hit a real wall',
              "You're mid-build and something won't click — a shape mismatch, a gradient that makes no sense, a paper line you can't parse. That confusion is the prerequisite. Without it, math doesn't stick.",
            ],
            [
              'Name the missing concept',
              'Use this ledger (or the glossary) to turn "I don\'t get it" into a noun — "I don\'t get what the transpose is doing here." A nameable gap is a small gap.',
            ],
            [
              'Read exactly one section',
              'Open Mathematics for Machine Learning to that one section, or watch the matching 3Blue1Brown chapter. Twenty minutes, with your build open in the next tab. Not the chapter before it. Not "from the beginning."',
            ],
            [
              'Return and re-derive',
              "Go back to the wall and explain it to your log in your own words. If you can't yet, you found a second concept — loop once more. The build is the exam; the book is just the hallway.",
            ],
          ].map(([title, detail], i) => (
            <li key={title} className="flex gap-5">
              <span className="font-mono text-sm text-vermillion">{i + 1}</span>
              <div>
                <h3 className="font-display font-semibold text-lg">{title}</h3>
                <p className="prose-note mt-0.5 text-[0.98rem]">{detail}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="prose-note mt-8 max-w-2xl">
          That's the whole discipline. The phases ahead will force the rest of the list out of you —
          attention needs dot products, scaling laws need logarithms, evals need statistics —{' '}
          <strong>each at the moment it's needed, never before.</strong>
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '1' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 1 — back to the build →
          </Link>
          <a
            href="https://mml-book.github.io"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Mathematics for Machine Learning — the raid target ↗
          </a>
          <a
            href="https://www.youtube.com/playlist?list=PLZHQObOWTQDPD3MizzM2xVFitgF8hE_ab"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            3Blue1Brown — essence of linear algebra ↗
          </a>
        </div>
      </Section>
    </main>
  )
}
