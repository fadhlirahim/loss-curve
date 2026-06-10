import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { BackpropGraph } from '@/components/backprop/graph'
import {
  DEFAULT_PARAMS,
  evaluate,
  fmt,
  lossAt,
  type NodeId,
  type Params,
  STEPS,
} from '@/components/backprop/model'
import { SlopePlot } from '@/components/backprop/slope-plot'
import { Section } from '@/components/section'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/learn/backprop')({
  head: () => ({ meta: [{ title: 'Backpropagation, interactively · Roadmap to Mastery' }] }),
  component: BackpropPage,
})

const DIALS: { id: keyof Params; hint: string }[] = [
  { id: 'a', hint: 'an input' },
  { id: 'b', hint: 'a weight' },
  { id: 'c', hint: 'a bias' },
  { id: 'f', hint: 'a scale' },
]

function BackpropPage() {
  const [params, setParams] = useState<Params>(DEFAULT_PARAMS)
  const [stepIdx, setStepIdx] = useState(-1)
  const [epsilon, setEpsilon] = useState(0.8)

  const evaluation = evaluate(params)
  const revealed = new Set<NodeId>(STEPS.slice(0, stepIdx + 1).map((s) => s.node))
  const step = stepIdx >= 0 ? STEPS[stepIdx] : null

  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">
          Interactive explainer ·{' '}
          <Link to="/phases/$phaseId" params={{ phaseId: '1' }} className="hover:underline">
            Phase 1 — Foundations
          </Link>
        </p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Backpropagation
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          A neural net is billions of dials, and training needs to know which direction to turn each
          one. Backpropagation is{' '}
          <strong>the bookkeeping that figures out, for every dial, which way is downhill</strong> —
          nothing more. It's the chain rule from calculus, applied backward through a graph of
          simple operations. Below is the smallest graph worth studying: turn the dials, then walk
          the gradient home.
        </p>
        <p className="rise rise-3 mt-4 font-mono text-[0.7rem] text-ink-faint">
          L = tanh(a × b + c) × f — one multiply, one add, one squish, one scale. A one-neuron
          network in miniature.
        </p>
      </div>

      {/* ── the lab ──────────────────────────────────────────── */}
      <Section label="§ 1 · The lab" title="Forward to compute, backward to blame">
        <p className="prose-note mb-8 max-w-2xl">
          The <strong>forward pass</strong> (ink numbers) just evaluates the expression left to
          right. The <strong>backward pass</strong> (vermillion numbers) then asks, node by node,
          right to left: <em>if this value wiggled, how much would L move?</em> Each node answers
          with one local rule times whatever the node downstream already computed — that product is
          the chain rule, and it's the entire algorithm.
        </p>

        <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
          <BackpropGraph evaluation={evaluation} revealed={revealed} active={step?.node ?? null} />

          {/* dials */}
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-4">
            {DIALS.map(({ id, hint }) => (
              <label key={id} className="block font-mono text-xs">
                <span className="flex justify-between text-ink-soft">
                  <span>
                    {id} <span className="text-ink-faint">· {hint}</span>
                  </span>
                  <span className="text-ink">{fmt(params[id])}</span>
                </span>
                <input
                  type="range"
                  min={-3}
                  max={3}
                  step={0.1}
                  value={params[id]}
                  onChange={(e) => setParams({ ...params, [id]: Number(e.target.value) })}
                  className="mt-1 w-full accent-vermillion"
                />
              </label>
            ))}
          </div>

          {/* backward-pass controls */}
          <div className="mt-5 flex flex-wrap items-center gap-3 border-paper-edge border-t pt-5">
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
              disabled={stepIdx >= STEPS.length - 1}
              className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion disabled:opacity-40 disabled:hover:bg-ink"
            >
              {stepIdx === -1 ? 'start the backward pass →' : 'step →'}
            </button>
            <button
              type="button"
              onClick={() => setStepIdx((i) => Math.max(-1, i - 1))}
              disabled={stepIdx === -1}
              className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
            >
              ← back
            </button>
            <button
              type="button"
              onClick={() => setStepIdx(-1)}
              disabled={stepIdx === -1}
              className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
            >
              reset
            </button>
            <span className="font-mono text-ink-faint text-xs">
              {stepIdx + 1}/{STEPS.length} gradients
            </span>
          </div>

          {/* the chain-rule ticker */}
          <div
            className={cn(
              'mt-4 border-l-2 px-4 py-3',
              step ? 'border-vermillion bg-paper-bright' : 'border-paper-edge',
            )}
          >
            {step ? (
              <>
                <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
                  node {step.node} · {step.rule}
                </p>
                <p className="mt-1.5 font-mono text-ink text-sm">{step.formula(evaluation)}</p>
                <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
                  {step.note}
                </p>
              </>
            ) : (
              <p className="font-mono text-ink-faint text-xs">
                gradients hidden — the backward pass starts at the output, where the answer is
                trivially 1. press start, then watch the blame flow right to left.
              </p>
            )}
          </div>
        </div>

        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — dashed boxes are leaves (the dials an optimizer would turn). drag a slider
          mid-walk: every revealed gradient recomputes live.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── the slope ────────────────────────────────────────── */}
      <Section label="§ 2 · What the number means" title="A gradient is a slope, and a promise">
        <p className="prose-note mb-8 max-w-2xl">
          Freeze every dial except <strong>a</strong> and plot L against it. The vermillion
          tangent's slope is exactly the ∂L/∂a the backward pass produced — backprop never saw this
          curve, yet it knows the steepness at your point. The promise is <em>local</em>: nudge a by
          ε and the tangent predicts ΔL ≈ slope × ε. Grow ε and watch the prediction (hollow ring)
          drift off the curve (moss dot). That gap is why training takes many <strong>small</strong>{' '}
          steps instead of one big one.
        </p>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
            <SlopePlot params={params} epsilon={epsilon} />
          </div>
          <div className="flex flex-col justify-center gap-5">
            <label className="block font-mono text-xs">
              <span className="flex justify-between text-ink-soft">
                <span>ε · the nudge</span>
                <span className="text-ink">{fmt(epsilon)}</span>
              </span>
              <input
                type="range"
                min={-1.5}
                max={1.5}
                step={0.05}
                value={epsilon}
                onChange={(e) => setEpsilon(Number(e.target.value))}
                className="mt-1 w-full accent-vermillion"
              />
            </label>
            <NudgeReadout params={params} epsilon={epsilon} />
            <p className="font-mono text-[0.7rem] text-ink-faint leading-relaxed">
              gradient descent is just: take the slope, step a small ε against it, recompute,
              repeat. the learning rate IS this ε.
            </p>
          </div>
        </div>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── the takeaway ─────────────────────────────────────── */}
      <Section label="§ 3 · The whole algorithm" title="Three local rules, multiplied backward">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            ['× swaps the inputs', '∂(x·y)/∂x = y. Wiggle one factor, L moves by the other.'],
            ['+ passes it through', '∂(x+y)/∂x = 1. Addition distributes the gradient unchanged.'],
            [
              'tanh scales by its slope',
              '∂tanh(x)/∂x = 1 − tanh²(x). Flat curve, dead gradient — saturation in one line.',
            ],
          ].map(([rule, why]) => (
            <div key={rule} className="border border-paper-edge bg-paper-deep/30 p-5">
              <h3 className="font-display font-semibold">{rule}</h3>
              <p className="mt-2 font-mono text-[0.78rem] text-ink-soft leading-relaxed">{why}</p>
            </div>
          ))}
        </div>
        <p className="prose-note mt-8 max-w-2xl">
          Every node answers one tiny local question and multiplies it by the gradient arriving from
          downstream — no node ever sees the whole graph. A billion-parameter transformer trains
          with exactly this loop, just with matrices in the boxes. If this page made sense, you're
          ready for the real Phase 1 deliverable:{' '}
          <strong>close this tab and rebuild it from a blank file</strong> — that's micrograd.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '1' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 1 — build your own micrograd →
          </Link>
          <a
            href="https://www.youtube.com/watch?v=VMj-3S1tku0"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Karpathy's spelled-out intro ↗
          </a>
          <a
            href="https://www.youtube.com/watch?v=Ilg3gGewQ5U"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            3Blue1Brown's visual take ↗
          </a>
        </div>
      </Section>
    </main>
  )
}

function NudgeReadout({ params, epsilon }: { params: Params; epsilon: number }) {
  const { values, grads } = evaluate(params)
  // clip the nudge to the plotted range so the readout matches the dots
  const aN = Math.min(3, Math.max(-3, params.a + epsilon))
  const eff = aN - params.a
  const predicted = grads.a * eff
  const actual = lossAt(aN, params) - values.L
  const gap = Math.abs(predicted - actual)

  return (
    <dl className="space-y-2 border border-paper-edge bg-paper-bright p-4 font-mono text-xs">
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">tangent predicts ΔL = {fmt(grads.a)} × ε</dt>
        <dd className="text-vermillion">{fmt(predicted)}</dd>
      </div>
      <div className="flex justify-between gap-4">
        <dt className="text-ink-soft">the curve actually moves</dt>
        <dd className="text-moss-deep dark:text-moss">{fmt(actual)}</dd>
      </div>
      <div className="flex justify-between gap-4 border-paper-edge border-t pt-2">
        <dt className="text-ink-soft">the local promise breaks by</dt>
        <dd className={cn(gap > 0.15 ? 'text-vermillion' : 'text-ink')}>{fmt(gap)}</dd>
      </div>
    </dl>
  )
}
