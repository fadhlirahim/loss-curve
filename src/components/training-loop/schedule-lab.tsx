import { useState } from 'react'
import { LossStrip } from '@/components/training-loop/loss-strip'
import {
  bigramFloor,
  ema,
  lrAt,
  race,
  type Schedule,
  UNIFORM_LOSS,
} from '@/components/training-loop/model'

const TOTAL = 400

/** §3 — the LR schedule: warmup + cosine, then race it against a fixed LR. */
export function ScheduleLab() {
  const [warmup, setWarmup] = useState(40)
  const [peak, setPeak] = useState(8)
  const [min, setMin] = useState(0.3)
  const [result, setResult] = useState<{ fixed: number[]; scheduled: number[] } | null>(null)

  const schedule: Schedule = { warmup, peak, min, total: TOTAL }
  const lrCurve = Array.from({ length: TOTAL + 1 }, (_, s) => lrAt(s, schedule))

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <LossStrip
          series={[{ label: 'η at step', values: lrCurve, color: 'var(--color-gold)' }]}
          cap={peak * 1.1}
          anchors={[
            { y: peak, label: 'peak' },
            { y: min, label: 'min' },
          ]}
          xLabel={`LR SCHEDULE · ${TOTAL} STEPS`}
        />
        <div className="flex flex-col justify-center gap-4">
          {(
            [
              ['warmup steps', warmup, 0, 150, 10, setWarmup],
              ['peak η', peak, 1, 12, 0.5, setPeak],
              ['min η', min, 0, 2, 0.1, setMin],
            ] as const
          ).map(([label, value, lo, hi, stepSize, set]) => (
            <label key={label} className="block font-mono text-xs">
              <span className="flex justify-between text-ink-soft">
                <span>{label}</span>
                <span className="text-ink">{value}</span>
              </span>
              <input
                type="range"
                min={lo}
                max={hi}
                step={stepSize}
                value={value}
                onChange={(e) => {
                  set(Number(e.target.value))
                  setResult(null)
                }}
                className="mt-1 w-full accent-vermillion"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="mt-5 border-paper-edge border-t pt-4">
        <button
          type="button"
          onClick={() => setResult(race(schedule, 4, 8))}
          className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
        >
          race fixed vs scheduled ▸
        </button>
        {result && (
          <div className="mt-4">
            <LossStrip
              series={[
                {
                  label: 'fixed at peak',
                  values: ema(result.fixed),
                  color: 'var(--color-ink-faint)',
                },
                {
                  label: 'warmup+cosine',
                  values: ema(result.scheduled),
                  color: 'var(--color-vermillion)',
                },
              ]}
              cap={UNIFORM_LOSS + 0.3}
              floor={1.1}
              anchors={[{ y: bigramFloor, label: 'bigram floor' }]}
              xLabel={`LOSS · IDENTICAL BATCHES, ${TOTAL} STEPS`}
            />
            <p className="mt-2 max-w-2xl font-mono text-[0.7rem] text-ink-faint leading-relaxed">
              same seeds, same batches — the only difference is η at each step. at bigram scale the
              schedule wins modestly or ties; the loss surface is too benign to punish a bad η. a
              billion-parameter net is not so forgiving: early updates on random weights are violent
              (that's what warmup absorbs), and the decay is what lets the run settle instead of
              ricocheting.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
