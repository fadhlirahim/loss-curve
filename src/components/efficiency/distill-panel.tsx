import { useState } from 'react'
import {
  CANDIDATES,
  DISTILL_CONTEXT,
  entropyBits,
  HARD_LABEL,
  softmaxT,
} from '@/components/efficiency/model'

function BarRows({ probs, tone }: { probs: number[]; tone: 'ink' | 'vermillion' }) {
  return (
    <div className="space-y-1.5">
      {CANDIDATES.map((c, i) => (
        <div key={c.token} className="grid grid-cols-[4.2rem_1fr_3.4rem] items-center gap-3">
          <span className="text-right font-mono text-[0.72rem] text-ink-soft">{c.token}</span>
          <span className="relative h-3 bg-paper-deep">
            <span
              className={
                tone === 'vermillion'
                  ? 'absolute inset-y-0 left-0 bg-vermillion'
                  : 'absolute inset-y-0 left-0 bg-ink'
              }
              style={{ width: `${probs[i] * 100}%` }}
            />
          </span>
          <span className="font-mono text-[0.68rem] text-ink tabular-nums">
            {(probs[i] * 100).toFixed(1)}%
          </span>
        </div>
      ))}
    </div>
  )
}

/**
 * §2 — what a student actually receives: the hard label's single bit of
 * "worm", vs the teacher distribution's full ranking, softened by T.
 */
export function DistillPanel() {
  const [temperature, setTemperature] = useState(1)

  const logits = CANDIDATES.map((c) => c.logit)
  const soft = softmaxT(logits, temperature)
  const softH = entropyBits(soft)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <p className="font-mono text-ink-faint text-xs">
        context: <span className="text-ink">"{DISTILL_CONTEXT} ___"</span>
      </p>

      <div className="mt-5 grid gap-8 sm:grid-cols-2">
        <div>
          <h4 className="font-mono text-[0.68rem] text-ink-soft uppercase tracking-widest">
            hard label — what SFT data carries
          </h4>
          <div className="mt-3">
            <BarRows probs={HARD_LABEL} tone="ink" />
          </div>
          <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
            entropy: <span className="text-ink tabular-nums">0.00 bits</span> — "worm, and that's
            all you learn."
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
            teacher distribution at T = {temperature.toFixed(1)}
          </h4>
          <div className="mt-3">
            <BarRows probs={soft} tone="vermillion" />
          </div>
          <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
            entropy: <span className="text-ink tabular-nums">{softH.toFixed(2)} bits</span> — the
            ranking and the <em>relative wrongness</em> come along.
          </p>
        </div>
      </div>

      <label className="mt-6 block max-w-xs font-mono text-xs">
        <span className="flex justify-between text-ink-soft">
          <span>T · distillation temperature</span>
          <span className="text-ink">{temperature.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={0.5}
          max={8}
          step={0.1}
          value={temperature}
          onChange={(e) => setTemperature(Number(e.target.value))}
          className="mt-1 w-full accent-vermillion"
        />
      </label>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          {temperature < 0.8 && (
            <>
              At low T the teacher is nearly a hard label — the dark knowledge is squeezed out.
              Distillation at T ≈ 0.5 barely beats training on labels.
            </>
          )}
          {temperature >= 0.8 && temperature <= 2.5 && (
            <>
              This is the working range:{' '}
              <strong className="text-ink">"seed" is plausible, "sofa" is absurd</strong> — that
              structure is what the hard label throws away, and it's the signal Hinton called dark
              knowledge. The student learns the teacher's whole similarity geometry, not one answer.
            </>
          )}
          {temperature > 2.5 && (
            <>
              Very soft: the distribution flattens toward the ranking alone. High T amplifies the
              tail's relative structure but shrinks the gradient signal — real recipes pick T around
              2–4 and scale the loss by T².
            </>
          )}
        </p>
      </div>
    </div>
  )
}
