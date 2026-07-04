import { useState } from 'react'
import { FORMATS, formatSpread } from '@/components/evals/model'
import { Chips } from '@/components/lab/chips'
import { cn } from '@/lib/utils'

function ScoreBar({
  label,
  value,
  wins,
  color,
}: {
  label: string
  value: number
  wins: boolean
  color: string
}) {
  return (
    <div className="grid grid-cols-[4.5rem_1fr_5.5rem] items-center gap-3 font-mono text-xs">
      <span className="text-ink-soft">{label}</span>
      <span className="relative h-4 bg-paper-deep">
        <span
          className="absolute inset-y-0 left-0"
          style={{ width: `${value}%`, background: color }}
        />
      </span>
      <span className="text-ink tabular-nums">
        {value}%{' '}
        {wins && (
          <span className="font-semibold text-[0.6rem] text-vermillion uppercase">wins</span>
        )}
      </span>
    </div>
  )
}

/** §4 — same two models, five prompt formats, and the ranking flips. */
export function FormatFlip() {
  const [formatId, setFormatId] = useState(FORMATS[0].id)

  const format = FORMATS.find((f) => f.id === formatId) ?? FORMATS[0]
  const spreadA = formatSpread('a')
  const spreadB = formatSpread('b')
  const aWins = FORMATS.filter((f) => f.a > f.b).length

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <Chips
        label="ask the same questions as…"
        options={FORMATS.map((f) => ({ id: f.id, label: f.label }))}
        value={formatId}
        onPick={setFormatId}
      />

      <div className="mt-6 space-y-3">
        <ScoreBar
          label="model A"
          value={format.a}
          wins={format.a > format.b}
          color="var(--color-vermillion)"
        />
        <ScoreBar
          label="model B"
          value={format.b}
          wins={format.b > format.a}
          color="var(--color-moss)"
        />
      </div>

      <p className="mt-4 font-mono text-[0.7rem] text-ink-faint">
        across all five formats: A ranges {spreadA.min}–{spreadA.max}% (a{' '}
        {spreadA.max - spreadA.min}-point prompt tax), B ranges {spreadB.min}–{spreadB.max}%. A wins{' '}
        {aWins} of 5 formats — the "better model" depends on the template.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <div className="border border-paper-edge bg-paper-bright p-4">
          <p className="font-mono text-[0.65rem] text-vermillion uppercase tracking-widest">
            the same disease, pairwise · position bias
          </p>
          <div className="mt-3 space-y-2 font-mono text-[0.75rem] text-ink-soft">
            <p>
              judge sees <span className="text-ink">A then B</span> →{' '}
              <span className="text-ink">"A wins, 62%"</span>
            </p>
            <p>
              judge sees <span className="text-ink">B then A</span> →{' '}
              <span className="text-ink">"B wins, 55%"</span>
            </p>
          </div>
          <p className="mt-3 text-[0.78rem] text-ink-faint leading-snug">
            An LLM judge prefers whichever answer it read first (illustrative numbers; the bias is
            real and documented). Fix: randomize order per item, report both directions.
          </p>
        </div>
        <div className={cn('border border-paper-edge bg-paper-bright p-4')}>
          <p className="font-mono text-[0.65rem] text-moss uppercase tracking-widest">
            why pairwise still beats absolute
          </p>
          <p className="mt-3 text-[0.78rem] text-ink-soft leading-relaxed">
            "Rate this answer 1–10" drifts with the judge's mood, verbosity, and scale
            interpretation. "Which of these two is better?" is anchored by construction — you
            inherit position bias, but that one is measurable and fixable. Comparative judgment plus
            order randomization is the current honest default.
          </p>
        </div>
      </div>
    </div>
  )
}
