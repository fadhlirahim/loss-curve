import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { WEEKLY_HABITS } from '@/data/roadmap'
import { isoWeekKey, toggleHabit, useProgress } from '@/hooks/use-progress'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/habits')({
  head: () => ({ meta: [{ title: 'The weekly loop · Roadmap to Mastery' }] }),
  component: HabitsPage,
})

const WEEKS_SHOWN = 8

function lastWeeks(n: number): string[] {
  const out: string[] = []
  const d = new Date()
  for (let i = 0; i < n; i++) {
    out.push(isoWeekKey(d))
    d.setDate(d.getDate() - 7)
  }
  return out
}

function HabitsPage() {
  const { habits } = useProgress()
  // Weeks are computed after mount so SSR HTML doesn't depend on the clock.
  const [weeks, setWeeks] = useState<string[]>([])
  useEffect(() => setWeeks(lastWeeks(WEEKS_SHOWN)), [])

  const weekDone = (week: string) => WEEKLY_HABITS.every((h) => habits[`${week}:${h.id}`])
  let streak = 0
  for (const week of weeks) {
    if (weekDone(week)) streak++
    else break
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-20 sm:px-10">
      <div className="pt-16 pb-10">
        <p className="rise overline">The habit engine · tick every week, every phase</p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          The weekly loop
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          The compounding habit matters more than any single course. Four habits, every week.{' '}
          <strong>Miss the courses, keep the loop</strong> — if you keep only the weekly habits and
          lose everything else, you'll still get there. They're the engine; the phases are just the
          route.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {WEEKLY_HABITS.map((h, i) => (
          <div key={h.id} className="border border-paper-edge bg-paper-deep/30 p-5">
            <h3 className="font-display font-semibold text-lg">
              <span className="mr-2 font-medium font-mono text-sm text-vermillion">0{i + 1}</span>
              {h.title}
            </h3>
            <p className="mt-1.5 text-[0.95rem] text-ink-soft leading-relaxed">{h.detail}</p>
          </div>
        ))}
      </div>

      <section className="mt-16">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="overline">The log · last {WEEKS_SHOWN} weeks</p>
          <span className="font-mono text-ink-faint text-xs">
            {streak > 0
              ? `${streak}-week streak — keep the loop`
              : 'no streak yet — this week counts'}
          </span>
        </div>

        {weeks.length === 0 ? (
          <p className="mt-6 font-mono text-ink-faint text-sm">loading the calendar…</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse">
              <thead>
                <tr className="border-ink-faint border-b text-left font-mono text-[0.68rem] text-ink-faint uppercase tracking-widest">
                  <th className="py-2 pr-4 font-medium">week</th>
                  {WEEKLY_HABITS.map((h) => (
                    <th key={h.id} className="px-3 py-2 text-center font-medium">
                      {h.id}
                    </th>
                  ))}
                  <th className="py-2 pl-3 text-right font-medium">loop</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week, wi) => {
                  const done = weekDone(week)
                  return (
                    <tr key={week} className="border-paper-edge border-b">
                      <td className="py-3 pr-4 font-mono text-ink-soft text-xs">
                        {week}
                        {wi === 0 && <span className="ml-2 text-vermillion">← now</span>}
                      </td>
                      {WEEKLY_HABITS.map((h) => {
                        const ticked = Boolean(habits[`${week}:${h.id}`])
                        return (
                          <td key={h.id} className="px-3 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleHabit(week, h.id)}
                              aria-pressed={ticked}
                              aria-label={`${h.title} — ${week}`}
                              className={cn(
                                'h-5 w-5 border transition-all',
                                ticked
                                  ? 'rotate-45 border-moss-deep bg-moss'
                                  : 'border-ink-faint bg-paper-bright hover:border-ink',
                              )}
                            />
                          </td>
                        )
                      })}
                      <td
                        className={cn(
                          'py-3 pl-3 text-right font-mono text-xs',
                          done ? 'text-moss' : 'text-ink-faint',
                        )}
                      >
                        {done ? '✓ closed' : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  )
}
