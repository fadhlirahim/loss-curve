import { useState } from 'react'
import { ANSWER_SET, GRADERS, type GraderId, grade, gradeAll } from '@/components/evals/model'
import { Chips } from '@/components/lab/chips'
import { cn } from '@/lib/utils'

/** §2 — four real grading functions, one fixed answer sheet, four different papers. */
export function GraderLab() {
  const [graderId, setGraderId] = useState<GraderId>('exact')

  const { passes, score } = gradeAll(graderId)
  const grader = GRADERS.find((g) => g.id === graderId)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Chips
          label="the grader"
          options={GRADERS.map((g) => ({ id: g.id, label: g.label }))}
          value={graderId}
          onPick={(id) => setGraderId(id as GraderId)}
        />
        <div className="text-right">
          <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
            headline score
          </p>
          <p className="font-display font-medium text-4xl text-ink tabular-nums">
            {(score * 100).toFixed(0)}%
          </p>
        </div>
      </div>
      <p className="mt-2 font-mono text-[0.7rem] text-ink-faint">{grader?.desc}</p>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {ANSWER_SET.map((item, i) => {
          const pass = passes[i]
          const falsePositive = pass && item.modelWrong
          return (
            <div
              key={item.q}
              className={cn(
                'border p-3',
                falsePositive
                  ? 'border-vermillion bg-vermillion/10'
                  : pass
                    ? 'border-moss/60 bg-paper-bright'
                    : 'border-paper-edge bg-paper-bright/50',
              )}
            >
              <p className="text-[0.8rem] text-ink-faint leading-snug">{item.q}</p>
              <p className="mt-1.5 font-mono text-[0.75rem] text-ink-soft">
                truth <span className="text-ink">"{item.truth}"</span> · model{' '}
                <span className="text-ink">"{item.answer}"</span>
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[0.62rem]">
                <span className={cn('font-semibold', pass ? 'text-moss' : 'text-vermillion')}>
                  {falsePositive
                    ? '✓ scored correct — but the model was WRONG'
                    : pass
                      ? '✓ correct'
                      : '✗ wrong'}
                </span>
                <span className="ml-auto flex gap-1.5 text-ink-faint">
                  {GRADERS.map((g) => (
                    <span
                      key={g.id}
                      title={g.label}
                      className={cn(
                        'inline-block h-2 w-2 rounded-full',
                        grade(g.id, item.truth, item.answer) ? 'bg-moss' : 'bg-paper-edge',
                      )}
                    />
                  ))}
                </span>
              </div>
              {item.note && (
                <p className="mt-1.5 text-[0.72rem] text-gold leading-snug">{item.note}</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          Same model, same ten answers: <strong className="text-ink">20% or 80%</strong> depending
          on which grading function you picked. The dots on each card show all four graders at once.
          Which number goes in the paper — and does the paper say which grader produced it?
        </p>
      </div>
    </div>
  )
}
