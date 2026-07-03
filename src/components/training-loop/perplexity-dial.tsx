import { useState } from 'react'
import { fmt, UNIFORM_LOSS, VOCAB_SIZE } from '@/components/training-loop/model'
import { cn } from '@/lib/utils'

/**
 * §4 — loss is exp-scale: read it as perplexity, "how many next chars is
 * the model effectively choosing between." Anchored to this page's model.
 */
export function PerplexityDial({ modelValLoss }: { modelValLoss: number | undefined }) {
  const [loss, setLoss] = useState(2.2)

  const anchors: { loss: number; label: string; live?: boolean }[] = [
    { loss: UNIFORM_LOSS, label: `uniform over the alphabet · ln ${VOCAB_SIZE}` },
    ...(modelValLoss !== undefined && Number.isFinite(modelValLoss)
      ? [{ loss: modelValLoss, label: 'your §2 model, right now (val)', live: true }]
      : []),
    { loss: 1.0, label: 'a strong char model with real context' },
  ]

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
        <label className="block self-center font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>cross-entropy loss</span>
            <span className="text-ink">{fmt(loss)}</span>
          </span>
          <input
            type="range"
            min={0.4}
            max={3.6}
            step={0.02}
            value={loss}
            onChange={(e) => setLoss(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <div className="border border-paper-edge bg-paper-bright px-6 py-4 text-center">
          <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
            perplexity = e^loss
          </p>
          <p className="mt-1 font-display font-medium text-4xl text-ink tabular-nums">
            {Math.exp(loss).toFixed(1)}
          </p>
          <p className="mt-1 font-mono text-[0.65rem] text-ink-faint">
            "choosing between ~{Math.round(Math.exp(loss))} chars"
          </p>
        </div>
      </div>

      <ul className="mt-5 space-y-2 border-paper-edge border-t pt-4">
        {anchors.map((a) => (
          <li
            key={a.label}
            className="flex flex-wrap items-baseline justify-between gap-x-4 font-mono text-xs"
          >
            <span className={cn(a.live ? 'text-vermillion' : 'text-ink-soft')}>
              {a.live && '● '}
              {a.label}
            </span>
            <span className="text-ink tabular-nums">
              loss {fmt(a.loss)} → ppl {Math.exp(a.loss).toFixed(1)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
