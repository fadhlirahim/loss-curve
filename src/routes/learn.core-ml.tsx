import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { TrainValCurves } from '@/components/core-ml/curves'
import {
  CAPACITIES,
  type CapacityId,
  DECAYS,
  type DecayId,
  LABEL_NOISE,
  makeSplit,
} from '@/components/core-ml/model'
import { ExperimentCards, RuleCards } from '@/components/lab/cards'
import { Chips } from '@/components/lab/chips'
import { Boundary } from '@/components/neural-net/boundary'
import {
  EPOCHS_PER_TICK,
  fmt,
  initNet,
  MAX_EPOCHS,
  meanLoss,
  trainEpochs,
} from '@/components/neural-net/model'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import { useTicker } from '@/hooks/use-ticker'

export const Route = createFileRoute('/learn/core-ml')({
  head: () => ({ meta: [{ title: 'Core ML, interactively · Roadmap to Mastery' }] }),
  component: CoreMlPage,
})

type Config = { capacity: CapacityId; decay: DecayId; seed: number }

const DEFAULT_CONFIG: Config = { capacity: 'huge', decay: 'none', seed: 1 }

const EXPERIMENTS: { title: string; setup: Partial<Config>; story: string }[] = [
  {
    title: 'memorize the noise',
    setup: { capacity: 'huge', decay: 'none' },
    story:
      'An oversized net, no regularization. Train loss marches to zero — it learns every flipped label by heart — while val loss bottoms out early and then climbs forever. The two curves diverging is the most important picture in this phase.',
  },
  {
    title: 'the goldilocks net',
    setup: { capacity: 'right', decay: 'light' },
    story:
      'Right-sized capacity, light decay. The exam tracks the homework all the way down and stays there. This is what "it generalizes" looks like — and note it never reaches zero train loss. It shouldn\'t: 10% of the homework answers are wrong.',
  },
  {
    title: 'too simple to overfit',
    setup: { capacity: 'tiny', decay: 'none' },
    story:
      "Two hidden neurons can't draw a circle, so both losses park high and flat. That's bias: the model family can't express the truth, and no amount of training fixes it. Underfitting is failure too — just a quieter one.",
  },
  {
    title: 'the rescue',
    setup: { capacity: 'huge', decay: 'heavy' },
    story:
      'The same oversized net that memorized everything — now with heavy weight decay pulling every weight toward zero. It can no longer afford to wrap noise points, so it spends its budget on the real shape. Regularization buys generalization with capacity.',
  },
]

function CoreMlPage() {
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
          Core ML
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          The{' '}
          <Link to="/learn/neural-net" className="link-ink">
            previous lab
          </Link>{' '}
          asked <em>can it learn?</em> This one asks the question that makes you a scientist instead
          of a spectator: <strong>how do you know what it learned is real?</strong> The answer is a
          held-out exam, a loss you understand, and a healthy fear of your own homework scores. This
          is the grammar of every experiment you'll ever run.
        </p>
      </div>

      <CrossEntropyLab />
      <hr className="rule mx-auto max-w-4xl" />
      <OverfitLab />
      <hr className="rule mx-auto max-w-4xl" />

      {/* ── the takeaway ─────────────────────────────────────── */}
      <Section label="§ 4 · The grammar" title="Three sentences you now own">
        <RuleCards
          items={[
            {
              rule: 'cross-entropy prices confidence',
              tex: 'L = -\\log p_{\\text{truth}}',
              why: "Being wrong is cheap; being confidently wrong is catastrophic. The loss is the exam's grading rubric — know what it punishes.",
            },
            {
              rule: 'the split is the experiment',
              tex: '\\text{train} \\;\\cap\\; \\text{val} \\;=\\; \\varnothing',
              why: 'Homework grades flatter; only the held-out exam measures learning. Tune on val, and keep a test set you touch once. Evals lie when sets leak.',
            },
            {
              rule: 'overfitting has three fixes',
              tex: '\\text{data} \\uparrow \\quad \\lambda \\uparrow \\quad \\text{stop early}',
              why: 'More data, a smaller/regularized model, or stop at the moss dot. (The milestone asks you for three — these are them.)',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          The Phase 1 milestone says it directly:{' '}
          <strong>
            explain cross-entropy, the train/val split, and overfitting with three fixes — in your
            own words, in your log.
          </strong>{' '}
          You've now watched all three happen to a real network. Write the log entry while the
          curves are fresh; that entry is the artifact.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '1' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 1 — write the log entry →
          </Link>
          <a
            href="https://karpathy.github.io/2019/04/25/recipe/"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            Karpathy — a recipe for training neural networks ↗
          </a>
        </div>
      </Section>
    </main>
  )
}

// ── §1 cross-entropy ──────────────────────────────────────────────

function CrossEntropyLab() {
  const [p, setP] = useState(0.3)
  const loss = -Math.log(p)

  const W = 480
  const H = 210
  const PAD = { top: 16, right: 16, bottom: 28, left: 16 }
  const CAP = 4
  const x = (v: number) => PAD.left + ((v - 0.02) / 0.98) * (W - PAD.left - PAD.right)
  const y = (l: number) => PAD.top + ((CAP - Math.min(l, CAP)) / CAP) * (H - PAD.top - PAD.bottom)
  const curve = Array.from({ length: 97 }, (_, i) => {
    const v = 0.02 + (i / 96) * 0.98
    return `${i === 0 ? 'M' : 'L'}${x(v).toFixed(1)},${y(-Math.log(v)).toFixed(1)}`
  }).join(' ')

  return (
    <Section label="§ 1 · The loss" title="The price of confidence">
      <p className="prose-note mb-8 max-w-2xl">
        Cross-entropy asks one question per example:{' '}
        <strong>how much probability did you give the true answer?</strong> Full marks costs
        nothing; hedging costs a little; confident wrongness costs without bound. That asymmetry is
        the whole personality of the loss — and why a falling loss curve means "less wrong," not
        "more right."
      </p>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full"
            role="img"
            aria-label="Cross-entropy loss curve"
          >
            <title>L = −log p</title>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={H - PAD.bottom}
              y2={H - PAD.bottom}
              stroke="var(--color-ink-faint)"
            />
            <line
              x1={x(0.5)}
              x2={x(0.5)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--color-paper-edge)"
              strokeDasharray="2 5"
            />
            <text
              x={x(0.5)}
              y={PAD.top + 8}
              textAnchor="middle"
              fontFamily="var(--font-mono)"
              fontSize="9"
              fill="var(--color-ink-faint)"
            >
              p = 0.5 · coin flip
            </text>
            <path d={curve} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
            <circle cx={x(p)} cy={y(loss)} r="5.5" fill="var(--color-vermillion)" />
            <text
              x={W - PAD.right}
              y={H - 8}
              textAnchor="end"
              fontFamily="var(--font-mono)"
              fontSize="10"
              letterSpacing="0.08em"
              fill="var(--color-ink-faint)"
            >
              P(TRUTH) — WHAT THE MODEL GAVE THE RIGHT ANSWER →
            </text>
          </svg>
        </div>
        <div className="flex flex-col justify-center gap-5">
          <Tex block tex="L = -\log p_{\text{truth}}" className="text-ink" />
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>p · probability on the truth</span>
              <span className="text-ink">{p.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={0.02}
              max={0.99}
              step={0.01}
              value={p}
              onChange={(e) => setP(Number(e.target.value))}
              className="mt-1 w-full accent-vermillion"
            />
          </label>
          <p className="border border-paper-edge bg-paper-bright p-4 font-mono text-xs leading-relaxed">
            <span className="text-ink-soft">loss = −log({p.toFixed(2)}) = </span>
            <span className="text-vermillion">{loss.toFixed(2)}</span>
            <span className="text-ink-faint">
              {' '}
              —{' '}
              {p < 0.1
                ? 'confidently wrong. the loss explodes — one example like this dominates a whole batch.'
                : p < 0.55
                  ? 'hedging near the coin-flip line (ln 2 ≈ 0.69) — where untrained nets start.'
                  : p < 0.9
                    ? 'decent — most of the remaining loss in real training lives here.'
                    : 'near-certain and correct — almost free.'}
            </span>
          </p>
        </div>
      </div>
    </Section>
  )
}

// ── §2–3 the overfitting lab ─────────────────────────────────────

function OverfitLab() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [net, setNet] = useState(() => netFor(DEFAULT_CONFIG))
  const [trainLosses, setTrainLosses] = useState<number[]>([])
  const [valLosses, setValLosses] = useState<number[]>([])
  const [running, setRunning] = useState(false)

  const { train, val } = useMemo(() => makeSplit(config.seed), [config.seed])

  function netFor(c: Config) {
    const cap = CAPACITIES.find((x) => x.id === c.capacity) ?? CAPACITIES[2]
    return initNet(cap.hidden, 'random', c.seed)
  }

  function update(partial: Partial<Config>, autorun = false) {
    const next = { ...config, ...partial }
    setConfig(next)
    setNet(netFor(next))
    setTrainLosses([])
    setValLosses([])
    setRunning(autorun)
  }

  const lambda = DECAYS.find((d) => d.id === config.decay)?.lambda ?? 0
  const epochs = trainLosses.length * EPOCHS_PER_TICK
  const done = epochs >= MAX_EPOCHS
  useTicker(running && !done, () => {
    const r = trainEpochs(net, train, 1, 'tanh', EPOCHS_PER_TICK, lambda)
    setNet(r.net)
    setTrainLosses((l) => [...l, r.loss])
    setValLosses((l) => [...l, meanLoss(r.net, val, 'tanh')])
  })
  useEffect(() => {
    if (done) setRunning(false)
  }, [done])

  const trainLoss = trainLosses[trainLosses.length - 1]
  const valLoss = valLosses[valLosses.length - 1]
  const bestIdx = valLosses.reduce((best, l, i) => (l < valLosses[best] ? i : best), 0)
  const bestVal = valLosses[bestIdx]
  const verdict = verdictFor(epochs, trainLoss, valLoss, bestVal)

  return (
    <>
      <Section label="§ 2 · The lab" title="Homework vs exam">
        <p className="prose-note mb-8 max-w-2xl">
          Same rings, harder rules: the net trains on the <strong>filled dots only</strong> — and{' '}
          {Math.round(LABEL_NOISE * 100)}% of their labels are deliberately wrong, because real
          labels always are. The <strong>hollow rings are the exam</strong>: held out, clean, never
          trained on. Watch both losses. The homework score always improves; whether the exam
          follows is the entire question of machine learning.
        </p>

        <div id="lab" className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <Boundary net={net} data={train} valData={val} activation="tanh" />
            <div className="flex flex-col justify-between gap-5">
              <Chips
                label="capacity"
                options={CAPACITIES.map((c) => ({ id: c.id, label: c.label }))}
                value={config.capacity}
                onPick={(id) => update({ capacity: id as CapacityId })}
              />
              <Chips
                label="weight decay · L2"
                options={DECAYS.map((d) => ({ id: d.id, label: d.label }))}
                value={config.decay}
                onPick={(id) => update({ decay: id as DecayId })}
              />
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setRunning((r) => !r && !done)}
                  disabled={done}
                  className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion disabled:opacity-40 disabled:hover:bg-ink"
                >
                  {running ? 'pause' : epochs === 0 ? 'train ▸' : 'resume ▸'}
                </button>
                <button
                  type="button"
                  onClick={() => update({})}
                  className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink"
                >
                  reset
                </button>
                <button
                  type="button"
                  onClick={() => update({ seed: config.seed + 1 }, running)}
                  className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink"
                >
                  re-roll ⚄
                </button>
              </div>
              <TrainValCurves
                trainLosses={trainLosses}
                valLosses={valLosses}
                bestIdx={bestIdx}
                perTick={EPOCHS_PER_TICK}
              />
            </div>
          </div>

          <p className="mt-4 border-paper-edge border-t pt-3 font-mono text-xs">
            <span className="text-ink-faint">
              epoch {epochs} · homework {trainLoss === undefined ? '—' : fmt(trainLoss)} · exam{' '}
              {valLoss === undefined ? '—' : fmt(valLoss)}
              {bestVal !== undefined &&
                ` · best exam ${fmt(bestVal)} @ epoch ${(bestIdx + 1) * EPOCHS_PER_TICK}`}{' '}
              ·{' '}
            </span>
            <span className={verdict.tone}>{verdict.label}</span>
          </p>
        </div>
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 2 — filled = train (with {Math.round(LABEL_NOISE * 100)}% wrong labels) · hollow =
          held-out val. the moss dot on the chart is where early stopping would have saved you.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      <Section label="§ 3 · Run these" title="Bias, variance, and the two rescues">
        <ExperimentCards items={EXPERIMENTS} onLoad={(setup) => update({ ...setup }, true)} />
      </Section>
    </>
  )
}

function verdictFor(
  epochs: number,
  trainLoss: number | undefined,
  valLoss: number | undefined,
  bestVal: number | undefined,
): { label: string; tone: string } {
  if (epochs === 0 || trainLoss === undefined || valLoss === undefined || bestVal === undefined)
    return { label: 'untrained — no grades yet', tone: 'text-ink-faint' }
  if (valLoss > bestVal + 0.15 && trainLoss < valLoss - 0.2)
    return {
      label: 'overfitting — the homework score is a lie now',
      tone: 'text-vermillion',
    }
  if (valLoss < 0.35 && valLoss - trainLoss < 0.15)
    return {
      label: 'generalizing ✓ — the exam agrees with the homework',
      tone: 'text-moss-deep dark:text-moss',
    }
  if (epochs >= 1600 && trainLoss > 0.38)
    return {
      label: "underfitting — can't even fit the homework (bias)",
      tone: 'text-gold',
    }
  if (epochs >= MAX_EPOCHS) return { label: `stopped at ${MAX_EPOCHS} epochs`, tone: 'text-gold' }
  return { label: 'training…', tone: 'text-ink-faint' }
}
