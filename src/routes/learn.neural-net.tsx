import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { ExperimentCards, RuleCards } from '@/components/lab/cards'
import { Chips } from '@/components/lab/chips'
import { Boundary, NetLossStrip } from '@/components/neural-net/boundary'
import {
  type Activation,
  ARCHITECTURES,
  type ArchId,
  accuracy,
  DATASETS,
  type DatasetKind,
  EPOCHS_PER_TICK,
  fmt,
  type InitKind,
  initNet,
  MAX_EPOCHS,
  makeDataset,
  paramCount,
  trainEpochs,
} from '@/components/neural-net/model'
import { Section } from '@/components/section'
import { Tex } from '@/components/tex'
import { useTicker } from '@/hooks/use-ticker'

export const Route = createFileRoute('/learn/neural-net')({
  head: () => ({
    meta: [{ title: 'A neural net from scratch, interactively · Roadmap to Mastery' }],
  }),
  component: NeuralNetPage,
})

type Config = {
  dataset: DatasetKind
  arch: ArchId
  activation: Activation
  init: InitKind
  lr: number
  seed: number
}

const DEFAULT_CONFIG: Config = {
  dataset: 'rings',
  arch: 'shallow',
  activation: 'tanh',
  init: 'random',
  lr: 1,
  seed: 1,
}

const EXPERIMENTS: { title: string; setup: Partial<Config>; story: string }[] = [
  {
    title: "the line that couldn't",
    setup: { dataset: 'rings', arch: 'linear', init: 'random' },
    story:
      'No hidden layer on the rings. The loss flatlines just under the coin-flip line forever — no learning rate, no patience, no luck will fix it. A linear model draws one straight line, and no straight line separates inside from outside.',
  },
  {
    title: 'bend it',
    setup: { dataset: 'rings', arch: 'shallow', init: 'random' },
    story:
      'Same data, eight hidden neurons. Each neuron contributes one soft fold; together they close a loop around the inner class in a few hundred epochs. This is everything an activation function buys you.',
  },
  {
    title: 'dead symmetry',
    setup: { dataset: 'rings', arch: 'shallow', init: 'zeros' },
    story:
      "Same architecture, every weight initialized to exactly zero. All eight neurons compute the same thing, receive the same gradient, and stay identical forever — the loss never leaves ln 2. Random init isn't a nicety; it's what makes neurons differentiable from each other.",
  },
  {
    title: 'the deep carve',
    setup: { dataset: 'spiral', arch: 'deep', init: 'random' },
    story:
      'Two interleaved spirals, two hidden layers. Watch the boundary stay confused for the first thousand epochs, then snap into the spiral as layer two starts composing the folds layer one found. Features of features — give it ~30 seconds.',
  },
]

function NeuralNetPage() {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [net, setNet] = useState(() => netFor(DEFAULT_CONFIG))
  const [losses, setLosses] = useState<number[]>([])
  const [running, setRunning] = useState(false)

  const data = useMemo(
    () => makeDataset(config.dataset, config.seed),
    [config.dataset, config.seed],
  )

  function netFor(c: Config) {
    const arch = ARCHITECTURES.find((a) => a.id === c.arch) ?? ARCHITECTURES[1]
    return initNet(arch.hidden, c.init, c.seed)
  }

  /** Any knob change re-initializes the net — a new experiment starts clean. */
  function update(partial: Partial<Config>, autorun = false) {
    const next = { ...config, ...partial }
    setConfig(next)
    setNet(netFor(next))
    setLosses([])
    setRunning(autorun)
  }

  const epochs = losses.length * EPOCHS_PER_TICK
  const loss = losses[losses.length - 1]
  const acc = accuracy(net, data, config.activation)
  const carved = loss !== undefined && loss < 0.02
  const done = epochs >= MAX_EPOCHS || carved
  useTicker(running && !done, () => {
    const r = trainEpochs(net, data, config.lr, config.activation, EPOCHS_PER_TICK)
    setNet(r.net)
    setLosses((l) => [...l, r.loss])
  })
  useEffect(() => {
    if (done) setRunning(false)
  }, [done])

  const verdict = verdictFor(config, epochs, loss, acc)

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
          A neural net from scratch
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          <Link to="/learn/backprop" className="link-ink">
            Backprop
          </Link>{' '}
          computes the gradients,{' '}
          <Link to="/learn/gradient-descent" className="link-ink">
            gradient descent
          </Link>{' '}
          takes the steps — now assemble the dials into <strong>layers</strong> and watch a function
          take shape. The network below is real and trains in your browser: two inputs, a stack of
          number-mixers, one verdict. Its entire job is to tint this square correctly.
        </p>
        <p className="rise rise-3 mt-4 flex flex-wrap items-center gap-x-3 font-mono text-[0.7rem] text-ink-faint">
          <Tex
            tex="a^{(l)} = \sigma\!\left(W^{(l)} a^{(l-1)} + b^{(l)}\right)"
            className="text-[1.05rem] text-ink"
          />
          <span>— mix, shift, bend. repeat per layer. that's the whole machine.</span>
        </p>
      </div>

      {/* ── the lab ──────────────────────────────────────────── */}
      <Section label="§ 1 · The lab" title="Carve the boundary">
        <p className="prose-note mb-8 max-w-2xl">
          Each dot is a training example; the tint is the network's current opinion about every
          point in the square. Training is just{' '}
          <strong>backprop + gradient descent, the two labs you've already run</strong>, looping
          over these dots. Pick a dataset and an architecture, press train, and watch the boundary
          get carved — then break it on purpose with the experiments below.
        </p>

        <div id="lab" className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
            <Boundary net={net} data={data} activation={config.activation} />
            <div className="flex flex-col justify-between gap-5">
              {/* dataset */}
              <Chips
                label="data"
                options={DATASETS.map((d) => ({ id: d.id, label: `${d.label} · ${d.hint}` }))}
                value={config.dataset}
                onPick={(id) => update({ dataset: id as DatasetKind })}
              />
              {/* architecture */}
              <Chips
                label="architecture"
                options={ARCHITECTURES.map((a) => ({ id: a.id, label: a.label }))}
                value={config.arch}
                onPick={(id) => update({ arch: id as ArchId })}
              />
              <div className="grid grid-cols-2 gap-x-6">
                <Chips
                  label="activation"
                  options={[
                    { id: 'tanh', label: 'tanh' },
                    { id: 'relu', label: 'relu' },
                  ]}
                  value={config.activation}
                  onPick={(id) => update({ activation: id as Activation })}
                />
                <Chips
                  label="init"
                  options={[
                    { id: 'random', label: 'random' },
                    { id: 'zeros', label: 'zeros' },
                  ]}
                  value={config.init}
                  onPick={(id) => update({ init: id as InitKind })}
                />
              </div>
              <label className="block font-mono text-xs">
                <span className="flex justify-between text-ink-soft">
                  <span>η · learning rate</span>
                  <span className="text-ink">{config.lr.toFixed(2)}</span>
                </span>
                <input
                  type="range"
                  min={0.05}
                  max={3}
                  step={0.05}
                  value={config.lr}
                  onChange={(e) => update({ lr: Number(e.target.value) }, running)}
                  className="mt-1 w-full accent-vermillion"
                />
              </label>
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
                  title="new data + new initial weights"
                >
                  re-roll ⚄
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 border-paper-edge border-t pt-4">
            <NetLossStrip losses={losses} perTick={EPOCHS_PER_TICK} />
          </div>

          <p className="mt-3 border-paper-edge border-t pt-3 font-mono text-xs">
            <span className="text-ink-faint">
              epoch {epochs} · loss {loss === undefined ? '—' : fmt(loss)} · accuracy{' '}
              {Math.round(acc * 100)}% · {paramCount(net)} parameters ·{' '}
            </span>
            <span className={verdict.tone}>{verdict.label}</span>
          </p>
        </div>
        <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
          fig. 1 — every knob change starts a fresh network (that's the honest way to compare).
          re-roll to see how much initialization luck matters.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── experiments ──────────────────────────────────────── */}
      <Section label="§ 2 · Run these" title="Four experiments, four lessons">
        <ExperimentCards
          items={EXPERIMENTS}
          onLoad={(setup) => update({ ...setup, lr: 1 }, true)}
        />
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── the takeaway ─────────────────────────────────────── */}
      <Section label="§ 3 · Why it works" title="Mix, bend, stack">
        <RuleCards
          items={[
            {
              rule: 'activations bend',
              tex: 'W^{(2)}\\!\\left(W^{(1)}x\\right) = \\left(W^{(2)} W^{(1)}\\right) x',
              why: 'Stack linear layers without a nonlinearity and they collapse into one linear layer — all that depth, still a straight line. The bend between layers is load-bearing.',
            },
            {
              rule: 'depth composes',
              tex: 'f(x) = f_2(f_1(x))',
              why: 'Layer one finds simple folds; layer two combines folds into shapes. Features of features — the spiral falls to composition, not to more neurons in one row.',
            },
            {
              rule: 'init breaks the tie',
              tex: 'W \\sim \\mathcal{N}\\!\\left(0, \\tfrac{1}{n_{\\text{in}}}\\right)',
              why: 'Identical neurons get identical gradients and never differentiate — so start random. Scale by fan-in so signals neither explode nor vanish as they cross layers.',
            },
          ]}
        />
        <p className="prose-note mt-8 max-w-2xl">
          Everything on this page is ~120 lines of plain code — the forward loop, the backward loop,
          the update. No framework, no magic. That's the Phase 1 bet:{' '}
          <strong>build exactly this from a blank file</strong> (micrograd gives you the gradients,
          then this MLP on top), and deep learning stops being an API and starts being a mechanism
          you own.
        </p>
        <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '1' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            phase 1 — build this MLP yourself →
          </Link>
          <a
            href="https://www.youtube.com/watch?v=aircAruvnKk"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            3Blue1Brown — what is a neural network ↗
          </a>
          <a
            href="https://playground.tensorflow.org"
            target="_blank"
            rel="noreferrer"
            className="link-ink font-mono text-sm"
          >
            TensorFlow Playground — the giant version of this lab ↗
          </a>
        </div>
      </Section>
    </main>
  )
}

function verdictFor(
  config: Config,
  epochs: number,
  loss: number | undefined,
  acc: number,
): { label: string; tone: string } {
  if (loss !== undefined && loss < 0.02)
    return { label: `boundary carved in ${epochs} epochs ✓`, tone: 'text-moss-deep dark:text-moss' }
  if (config.init === 'zeros' && epochs >= 400 && loss !== undefined && loss > 0.6)
    return {
      label: 'symmetry never broke — all neurons identical, forever',
      tone: 'text-vermillion',
    }
  if (config.arch === 'linear' && config.dataset !== 'blobs' && epochs >= 800 && acc < 0.72)
    return { label: 'a line cannot solve this — add a hidden layer', tone: 'text-vermillion' }
  if (epochs >= MAX_EPOCHS) return { label: `stopped at ${MAX_EPOCHS} epochs`, tone: 'text-gold' }
  if (epochs === 0)
    return { label: 'untrained — the tint is initialization luck', tone: 'text-ink-faint' }
  return { label: 'training…', tone: 'text-ink-faint' }
}
