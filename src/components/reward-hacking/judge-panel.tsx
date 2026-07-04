import { useState } from 'react'
import {
  DEFAULT_LENGTH_WEIGHT,
  fmtScore,
  QUESTION,
  ranked,
} from '@/components/reward-hacking/model'
import { cn } from '@/lib/utils'

const TERM_LABELS: Record<string, string> = {
  relevance: 'on-topic terms',
  length: 'length',
  keywords: 'magic keywords',
  lists: 'bullet points',
  hedging: 'hedging',
}

/**
 * §1 — five responses to one question, scored live by a reward model whose
 * features are visible. Drag the length weight and watch the ranking flip.
 */
export function JudgePanel() {
  const [lengthWeight, setLengthWeight] = useState(DEFAULT_LENGTH_WEIGHT)
  const [open, setOpen] = useState('stuffed')

  const rows = ranked(lengthWeight)
  const stuffedBeatsShort =
    rows.findIndex((x) => x.r.id === 'stuffed') < rows.findIndex((x) => x.r.id === 'short')

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <p className="font-mono text-[0.7rem] text-ink-faint">
        prompt · <span className="text-ink">"{QUESTION}"</span>
      </p>

      <label className="mt-4 block max-w-sm font-mono text-xs">
        <span className="flex justify-between text-ink-soft">
          <span>length-bias weight</span>
          <span className="text-ink">{lengthWeight.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={6}
          step={0.1}
          value={lengthWeight}
          onChange={(e) => setLengthWeight(Number(e.target.value))}
          className="mt-1 w-full accent-vermillion"
        />
      </label>

      <ol className="mt-5 space-y-2">
        {rows.map(({ r, score }, rank) => (
          <li key={r.id} className="border border-paper-edge bg-paper-bright">
            <button
              type="button"
              onClick={() => setOpen(open === r.id ? '' : r.id)}
              className="flex w-full items-baseline gap-3 px-4 py-2.5 text-left"
            >
              <span className="font-mono text-sm text-vermillion">#{rank + 1}</span>
              <span className="font-display font-semibold">{r.label}</span>
              <span
                className={cn(
                  'font-mono text-[0.65rem] uppercase tracking-widest',
                  r.id === 'short' && 'text-moss',
                  r.id === 'stuffed' && 'text-vermillion',
                )}
              >
                {r.id === 'short' && 'correct, terse'}
                {r.id === 'stuffed' && 'zero content'}
              </span>
              <span className="ml-auto font-mono text-ink text-sm tabular-nums">
                {fmtScore(score.total)}
              </span>
            </button>
            {open === r.id && (
              <div className="border-paper-edge border-t px-4 py-3">
                <p className="whitespace-pre-line text-[0.85rem] text-ink-soft leading-relaxed">
                  {r.text}
                </p>
                <div className="mt-3 grid gap-1 sm:max-w-md">
                  {score.terms.map((t) => (
                    <div
                      key={t.name}
                      className="grid grid-cols-[7.5rem_1fr_3.5rem] items-center gap-3 font-mono text-[0.68rem]"
                    >
                      <span className="text-ink-faint">{TERM_LABELS[t.name]}</span>
                      <span className="relative h-2 bg-paper-deep">
                        <span
                          className={cn(
                            'absolute inset-y-0 left-0',
                            t.contribution >= 0 ? 'bg-vermillion' : 'bg-ink-faint',
                          )}
                          style={{ width: `${Math.min(100, Math.abs(t.contribution) * 25)}%` }}
                        />
                      </span>
                      <span className="text-right text-ink tabular-nums">
                        {fmtScore(t.contribution)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </li>
        ))}
      </ol>

      <div
        className={cn(
          'mt-4 border-l-2 px-4 py-3',
          stuffedBeatsShort ? 'border-vermillion bg-paper-bright' : 'border-moss bg-paper-bright',
        )}
      >
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          {stuffedBeatsShort ? (
            <>
              The <strong className="text-ink">keyword farmer</strong> — which contains nothing —
              currently outranks the <strong className="text-ink">terse expert</strong>, and the
              breakdown shows exactly why: padding and magic words are worth more than being right.
              A policy trained against this judge will learn that lesson in hours.
            </>
          ) : (
            <>
              With the length bias gone, the empty responses sink and the terse correct answer
              climbs. Same responses, same "quality" — a different judge. The ranking was never
              measuring correctness.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
