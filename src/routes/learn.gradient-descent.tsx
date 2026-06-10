import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Bowl, LossCurveStrip } from '@/components/gradient-descent/bowl'
import {
  advanceRace,
  bowlDone,
  bowlVerdict,
  descendBowl,
  fmt,
  initRace,
  RACERS,
  raceDone,
  racePath,
  raceStatus,
  W0,
} from '@/components/gradient-descent/model'
import { Ravine } from '@/components/gradient-descent/ravine'
import { RuleCards } from '@/components/lab/cards'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import { useTicker } from '@/hooks/use-ticker'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/learn/gradient-descent')({
  head: () => ({
    meta: [{ title: 'Gradient descent & optimizers, interactively · Roadmap to Mastery' }],
  }),
  component: GradientDescentPage,
})

const VERDICT_TONE = {
  ok: 'text-moss-deep dark:text-moss',
  warn: 'text-gold',
  bad: 'text-vermillion',
} as const

function GradientDescentPage() {
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
          Gradient descent &amp; optimizers
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          <Link to="/learn/backprop" className="link-ink">
            Backprop
          </Link>{' '}
          tells every dial which way is downhill. This page is about the other half of training:{' '}
          <strong>how big a step to take</strong>, and what to do when "just follow the slope" isn't
          enough. The learning rate is the single most consequential number you'll set — here you
          can feel why, then watch the two classic fixes race.
        </p>
      </div>

      <BowlLab />
      <hr className="rule mx-auto max-w-4xl" />
      <RavineLab />
      <hr className="rule mx-auto max-w-4xl" />

      {/* ── the takeaway ─────────────────────────────────────── */}
      <Section label="§ 3 · The whole toolbox" title="One number, two fixes">
        <RuleCards
          items={[
            {
              rule: 'learning rate η',
              why: 'The step size. Too small wastes compute, too big destroys the run, and the safe range depends on the curvature — which you never know in advance. Hence: watch the loss curve.',
            },
            {
              rule: 'momentum — a heavy ball',
              why: 'Average your recent gradients and step along that. Zigzags across the ravine cancel out; the steady pull along it compounds. One extra number (β ≈ 0.9), dramatic effect.',
            },
            {
              rule: 'Adam — a learning rate per dial',
              why: "Track each dial's typical gradient size and divide by it, so steep dials get small steps and shallow dials get big ones. The default optimizer for most of deep learning.",
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          The Phase 1 milestone asks you to{' '}
          <strong>diagnose a too-high learning rate from the loss curve</strong> — you've now
          watched that exact curve spike live. Next time it happens in a real run, you'll recognize
          the shape. Then go implement the loop: it's four lines, and you've already built the
          gradient machine it feeds on.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '1' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 1 — train an MLP and tune η yourself →
          </Link>
          <a
            href="https://www.youtube.com/watch?v=IHZwWFHWa-w"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            3Blue1Brown on gradient descent ↗
          </a>
          <a
            href="https://distill.pub/2017/momentum/"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Distill — why momentum really works ↗
          </a>
        </div>
      </Section>
    </main>
  )
}

function BowlLab() {
  const [lr, setLr] = useState(0.12)
  const [history, setHistory] = useState<number[]>([W0])
  const [running, setRunning] = useState(false)

  const done = bowlDone(history)
  useTicker(running && !done, () => setHistory((h) => descendBowl(h, lr)))
  useEffect(() => {
    if (done) setRunning(false)
  }, [done])

  const verdict = bowlVerdict(lr, history)
  const reset = () => {
    setHistory([W0])
    setRunning(false)
  }

  return (
    <Section label="§ 1 · The step size" title="One dial, one bowl, one fateful number">
      <p className="prose-note mb-8 max-w-2xl">
        The whole algorithm: <Tex tex="w \leftarrow w - \eta \cdot \frac{\partial L}{\partial w}" />
        , repeated. On this bowl the regimes are mathematically exact — each step multiplies the
        distance to the bottom by <Tex tex="(1 - 2\eta)" />. So drag η and find all four: a crawl, a
        glide, an overshooting convergence, and an explosion. At <Tex tex="\eta = 0.5" /> the bowl
        is solved in <em>one step</em> — real losses are never this kind.
      </p>

      <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
        <Bowl history={history} />
        <div className="mt-2 border-paper-edge border-t pt-3">
          <LossCurveStrip history={history} />
        </div>

        <div className="mt-4 grid items-end gap-x-8 gap-y-4 border-paper-edge border-t pt-4 sm:grid-cols-[1fr_auto]">
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>η · learning rate</span>
              <span className="text-ink">{lr.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0.01}
              max={1.2}
              step={0.01}
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              className="mt-1 w-full accent-vermillion"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => (done ? undefined : setRunning((r) => !r))}
              disabled={done}
              className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion disabled:opacity-40 disabled:hover:bg-ink"
            >
              {running ? 'pause' : 'run ▸'}
            </button>
            <button
              type="button"
              onClick={() => setHistory((h) => descendBowl(h, lr))}
              disabled={done}
              className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
            >
              step
            </button>
            <button
              type="button"
              onClick={reset}
              className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink"
            >
              reset
            </button>
          </div>
        </div>

        <p className="mt-4 border-paper-edge border-t pt-3 font-mono text-xs">
          <span className="text-ink-faint">
            step {history.length - 1} · w = {fmt(history[history.length - 1])} · verdict:{' '}
          </span>
          <span className={cn(VERDICT_TONE[verdict.tone])}>{verdict.label}</span>
        </p>
      </div>
      <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
        fig. 1 — change η mid-run: you can rescue a diverging ball, or wreck a gliding one. the
        lower strip is what you'd see in a real training log.
      </p>
    </Section>
  )
}

function RavineLab() {
  const [lr, setLr] = useState(0.045)
  const [race, setRace] = useState(initRace)
  const [running, setRunning] = useState(false)

  const done = raceDone(race)
  useTicker(running && !done, () => setRace((s) => advanceRace(s, lr)))
  useEffect(() => {
    if (done) setRunning(false)
  }, [done])

  const reset = () => {
    setRace(initRace())
    setRunning(false)
  }

  return (
    <Section label="§ 2 · The optimizers" title="The ravine — SGD on a knife's edge">
      <p className="prose-note mb-8 max-w-2xl">
        Real losses aren't round bowls; they're <strong>ravines</strong> — many times steeper in
        some directions than others. One η must serve both: the steep wall sets SGD's stability
        limit (here η &lt; 0.05) while the shallow floor sets its speed, so it must run close to its
        own explosion to compete. <strong>Momentum</strong> smooths the zigzag like a heavy ball and
        tolerates twice the heat; <strong>Adam</strong> gives every dial its own step size and
        barely notices the conditioning. Race them at the default — then nudge η one notch past 0.05
        and race again.
      </p>

      <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
        <Ravine race={race} />

        <div className="mt-4 grid items-end gap-x-8 gap-y-4 border-paper-edge border-t pt-4 sm:grid-cols-[1fr_auto]">
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>η · shared learning rate</span>
              <span className="text-ink">{lr.toFixed(3)}</span>
            </span>
            <input
              type="range"
              min={0.005}
              max={0.07}
              step={0.005}
              value={lr}
              onChange={(e) => setLr(Number(e.target.value))}
              className="mt-1 w-full accent-vermillion"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => (done ? undefined : setRunning((r) => !r))}
              disabled={done}
              className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion disabled:opacity-40 disabled:hover:bg-ink"
            >
              {running ? 'pause' : 'race ▸'}
            </button>
            <button
              type="button"
              onClick={() => setRace((s) => advanceRace(s, lr))}
              disabled={done}
              className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
            >
              step
            </button>
            <button
              type="button"
              onClick={reset}
              className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink"
            >
              reset
            </button>
          </div>
        </div>

        <dl className="mt-4 grid gap-x-8 gap-y-2 border-paper-edge border-t pt-4 font-mono text-xs sm:grid-cols-3">
          {RACERS.map((r) => (
            <div key={r.id}>
              <dt className="flex items-center gap-2">
                <span
                  className="inline-block h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: r.color }}
                />
                <span className="text-ink">{r.name}</span>
                <span className="text-ink-faint">— {raceStatus(racePath(race, r.id))}</span>
              </dt>
              <dd className="mt-1.5 text-ink-soft">
                <Tex tex={r.recipe} className="text-[0.82rem]" />
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
        fig. 2 — drag η one notch past 0.05 and race again: SGD explodes in ~16 steps while the
        other two survive. drag it tiny (0.01) and SGD stalls on the floor while the heavy ball
        still arrives. momentum's loops are real — it overshoots the turns, and gets there anyway.
      </p>
    </Section>
  )
}
