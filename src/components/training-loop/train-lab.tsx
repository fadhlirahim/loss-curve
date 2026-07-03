import { useEffect, useState } from 'react'
import { LossStrip } from '@/components/training-loop/loss-strip'
import {
  type Bigram,
  bigramFloor,
  copyBigram,
  fmt,
  fullLoss,
  generate,
  initBigram,
  isDiverged,
  LAB_T,
  MAX_STEPS,
  STEPS_PER_TICK,
  sgdStep,
  TRAIN_IDS,
  UNIFORM_LOSS,
  VAL_IDS,
  VOCAB_SIZE,
} from '@/components/training-loop/model'
import { useTicker } from '@/hooks/use-ticker'
import { cn } from '@/lib/utils'

/** log-scale LR slider: value is an exponent, lr = 10^v, 0.01 → ~30. */
const LR_MIN = -2
const LR_MAX = 1.48

/**
 * §2 — real minibatch SGD on a real (bigram) language model, live in the
 * browser. Reports the latest val loss upward so §4 can anchor on it.
 */
export function TrainLab({ onValLoss }: { onValLoss: (loss: number | undefined) => void }) {
  const [model, setModel] = useState<Bigram>(initBigram)
  const [trainLosses, setTrainLosses] = useState<number[]>([])
  const [valLosses, setValLosses] = useState<number[]>([])
  const [running, setRunning] = useState(false)
  const [lrExp, setLrExp] = useState(0.3)
  const [b, setB] = useState(4)

  const lr = 10 ** lrExp
  const step = trainLosses.length * STEPS_PER_TICK
  const trainLoss = trainLosses[trainLosses.length - 1]
  const valLoss = valLosses[valLosses.length - 1]
  const diverged = isDiverged(model)
  const done = step >= MAX_STEPS || diverged

  function reset() {
    setModel(initBigram())
    setTrainLosses([])
    setValLosses([])
    setRunning(false)
    onValLoss(undefined)
  }

  useTicker(running && !done, () => {
    const w = copyBigram(model)
    let loss = 0
    const base = trainLosses.length * STEPS_PER_TICK
    for (let i = 0; i < STEPS_PER_TICK; i++) loss += sgdStep(w, TRAIN_IDS, b, LAB_T, lr, base + i)
    const val = fullLoss(w, VAL_IDS)
    setModel(w)
    setTrainLosses((l) => [...l, loss / STEPS_PER_TICK])
    setValLosses((l) => [...l, val])
    onValLoss(val)
  })
  useEffect(() => {
    if (done) setRunning(false)
  }, [done])

  const verdict = verdictFor(step, trainLoss, lr, diverged)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <LossStrip
            series={[
              { label: 'train', values: trainLosses, color: 'var(--color-vermillion)' },
              { label: 'val', values: valLosses, color: 'var(--color-moss)', dash: '4 3' },
            ]}
            cap={UNIFORM_LOSS + 0.3}
            floor={1.1}
            anchors={[
              { y: UNIFORM_LOSS, label: `ln ${VOCAB_SIZE} — uniform guessing` },
              { y: bigramFloor, label: 'bigram floor — context is the only way down' },
            ]}
            xLabel={`LOSS · ${STEPS_PER_TICK} STEPS PER POINT`}
          />
          <p className="mt-2 border-paper-edge border-t pt-2 font-mono text-xs">
            <span className="text-ink-faint">
              step {step} · train {trainLoss === undefined ? '—' : fmt(trainLoss)} · val{' '}
              {valLoss === undefined ? '—' : fmt(valLoss)} · ppl{' '}
              {valLoss === undefined ? '—' : fmt(Math.exp(valLoss))} ·{' '}
            </span>
            <span className={verdict.tone}>{verdict.label}</span>
          </p>
        </div>

        <div className="flex flex-col justify-between gap-5">
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>η · learning rate (log dial)</span>
              <span className="text-ink">{lr < 0.1 ? lr.toFixed(3) : lr.toFixed(2)}</span>
            </span>
            <input
              type="range"
              min={LR_MIN}
              max={LR_MAX}
              step={0.02}
              value={lrExp}
              onChange={(e) => setLrExp(Number(e.target.value))}
              className="mt-1 w-full accent-vermillion"
            />
          </label>
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>B · batch size (T fixed at {LAB_T})</span>
              <span className="text-ink">
                {b} · {b * LAB_T} tokens/step
              </span>
            </span>
            <input
              type="range"
              min={1}
              max={8}
              step={1}
              value={b}
              onChange={(e) => setB(Number(e.target.value))}
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
              {running ? 'pause' : step === 0 ? 'train ▸' : 'resume ▸'}
            </button>
            <button
              type="button"
              onClick={reset}
              className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink"
            >
              reset
            </button>
          </div>
          <p className="font-mono text-[0.7rem] text-ink-faint leading-relaxed">
            the dashed <span className="text-moss">val</span> curve is graded on the held-out corpus
            tail the model never trains on. when train keeps falling and val doesn't, you're
            memorizing, not learning.
          </p>
        </div>
      </div>

      {/* what the model says */}
      <div className="mt-5 border-paper-edge border-t pt-4">
        <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
          sampled from the current weights · seeded
        </p>
        <div className="mt-2 space-y-1 font-mono text-[0.78rem] text-ink-soft">
          {[1, 2, 3, 4, 5].map((seed) => (
            <p key={seed} className={cn(diverged && 'text-vermillion')}>
              ‣{' '}
              {diverged ? '(weights are NaN — nothing left to sample)' : generate(model, 38, seed)}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

function verdictFor(
  step: number,
  loss: number | undefined,
  lr: number,
  diverged: boolean,
): { label: string; tone: string } {
  if (diverged)
    return { label: 'diverged — weights are no longer numbers', tone: 'text-vermillion' }
  if (step === 0)
    return { label: 'untrained — W is all zeros, every guess uniform', tone: 'text-ink-faint' }
  if (loss !== undefined && loss < bigramFloor + 0.08)
    return {
      label: 'at the bigram floor ✓ — only context can go lower',
      tone: 'text-moss-deep dark:text-moss',
    }
  if (lr >= 8 && step >= 480 && loss !== undefined && loss > bigramFloor + 0.3)
    return {
      label: 'η too hot — the ball ricochets around the bowl and never settles',
      tone: 'text-vermillion',
    }
  if (step >= MAX_STEPS) return { label: `stopped at ${MAX_STEPS} steps`, tone: 'text-gold' }
  return { label: 'training…', tone: 'text-ink-faint' }
}
