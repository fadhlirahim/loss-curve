import { createFileRoute, Link } from '@tanstack/react-router'
import { useState } from 'react'
import { LossCurve } from '@/components/loss-curve'
import { Section } from '@/components/section'
import { ANTI_PATTERNS, DIAGNOSTIC, LEVELS, PRINCIPLES } from '@/data/levels'
import { overallProgress, PHASES, phaseProgress } from '@/data/roadmap'
import { setEntryPhase, useProgress } from '@/hooks/use-progress'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const { checked } = useProgress()
  const overall = overallProgress(checked)

  return (
    <main>
      {/* ── hero ─────────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-10 sm:px-10">
        <p className="rise overline">A field manual · not a contract</p>
        <h1 className="rise rise-1 mt-4 max-w-3xl font-display font-medium text-5xl leading-[1.05] tracking-tight sm:text-6xl">
          From strong engineer to{' '}
          <em className="font-light text-vermillion italic">independent researcher</em>.
        </h1>
        <p className="prose-note rise rise-2 mt-6 max-w-2xl">
          A step-by-step path through ML, LLMs, and the craft of research itself. Mastery is years,
          not months — but <strong>useful competence is months</strong>, and you climb by shipping
          artifacts, not finishing courses. The bottleneck is reps and taste, not information.
        </p>
        <div className="rise rise-3 mt-10 border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
          <LossCurve fraction={overall.fraction} />
          <p className="mt-2 font-mono text-[0.7rem] text-ink-faint">
            fig. 1 — your progress, plotted the only honest way: {overall.done}/{overall.total}{' '}
            checklist artifacts shipped. check boxes on the phase pages to descend.
          </p>
        </div>
        <div className="rise rise-4 mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-3">
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '0' }}
            className="bg-ink px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion"
          >
            start phase 0 — today, not tomorrow →
          </Link>
          <a href="#you-are-here" className="link-ink font-mono text-sm">
            or find your entry point
          </a>
        </div>
      </div>

      {/* ── plain words ──────────────────────────────────────── */}
      <Section label="§ 0 · In plain words" title="If the jargon loses you">
        <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {[
            [
              'An AI model',
              'is a guess-the-next-word machine — a program with billions of tiny dials that reads your words and guesses which word comes next, over and over.',
            ],
            [
              'Training',
              "means showing it mountains of text and, every time it guesses wrong, nudging all the dials a tiny bit so it's slightly less wrong next time. Billions of times.",
            ],
            [
              'A researcher',
              'runs fair experiments on these machines: change exactly one thing, keep everything else identical, run it several times, report honestly, publish so strangers can check.',
            ],
            [
              'This roadmap',
              'is the study plan from "can build software" to "can discover new, true things about how these machines work."',
            ],
          ].map(([term, def]) => (
            <p key={term} className="prose-note">
              <strong className="font-display">{term}</strong> {def}
            </p>
          ))}
        </div>
        <p className="mt-6 font-mono text-ink-faint text-xs">
          every term in this site is decoded in the{' '}
          <Link to="/glossary" className="link-ink">
            glossary
          </Link>{' '}
          — keep it open in a tab.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── principles ───────────────────────────────────────── */}
      <Section
        label="§ 1 · Core philosophy"
        title="Five principles — more important than the curriculum"
      >
        <ol className="space-y-6">
          {PRINCIPLES.map((p, i) => (
            <li key={p.title} className="flex gap-5">
              <span className="font-mono text-sm text-vermillion">0{i + 1}</span>
              <div>
                <h3 className="font-display font-semibold text-xl">{p.title}</h3>
                <p className="prose-note mt-1">{p.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── levels ───────────────────────────────────────────── */}
      <Section label="§ 2 · The levels" title='What "researcher" actually means'>
        <p className="prose-note mb-8 max-w-2xl">
          A ladder of capabilities, each reached by a deliverable — not a credential. Times assume
          ~10–15 focused hrs/week. <strong>Your near-term target is L2.</strong>
        </p>
        <div className="space-y-0">
          {LEVELS.map((level) => (
            <div
              key={level.id}
              className={cn(
                'grid gap-x-6 gap-y-1 border-paper-edge border-t py-4 sm:grid-cols-[5rem_1fr_8rem]',
                level.id === 'L2' && '-mx-4 border-l-2 border-l-vermillion bg-paper-deep/50 px-4',
              )}
            >
              <div className="font-mono font-semibold text-ink text-sm">
                {level.id}
                {level.id === 'L2' && <span className="ml-1 text-vermillion">←</span>}
              </div>
              <div>
                <span className="font-display font-semibold">{level.name}.</span>{' '}
                <span className="text-ink-soft">{level.capability}</span>
              </div>
              <div className="font-mono text-ink-faint text-xs sm:text-right">
                {level.time} · {level.reachedBy}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── diagnostic ───────────────────────────────────────── */}
      <div id="you-are-here">
        <Section label='§ 3 · "You are here"' title="Find your entry point">
          <Diagnostic />
        </Section>
      </div>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── phase map ────────────────────────────────────────── */}
      <Section label="§ 4 · The phase map" title="Six phases, one spiral">
        <PhaseMap />
        <p className="prose-note mt-8 max-w-2xl">
          Woven through all phases:{' '}
          <Link to="/method" className="link-ink">
            research-method
          </Link>{' '}
          — the craft of being a researcher. Start it in week 1, not at the end. Taking the
          reinforcement-learning route instead? The{' '}
          <Link to="/rl" className="link-ink">
            RL branch
          </Link>{' '}
          grows from the same trunk.
        </p>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      {/* ── anti-patterns ────────────────────────────────────── */}
      <Section label="§ 5 · Anti-patterns" title="How strong engineers waste months here">
        <div className="grid gap-x-10 gap-y-6 sm:grid-cols-2">
          {ANTI_PATTERNS.map((a) => (
            <div key={a.title}>
              <h3 className="font-display font-semibold text-lg">
                <span className="mr-2 text-vermillion">✗</span>
                {a.title}
              </h3>
              <p className="prose-note mt-1">{a.detail}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── start now ────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-4xl px-6 pb-20 sm:px-10">
        <div className="border border-ink bg-ink px-8 py-10 text-paper">
          <p className="overline">Start now</p>
          <p className="mt-4 max-w-2xl font-display font-medium text-2xl leading-snug sm:text-3xl">
            Open Phase 0 and do the week-1 vertical slice today. Not tomorrow, after more reading.{' '}
            <em className="text-paper-deep italic">Today.</em>
          </p>
          <p className="mt-3 max-w-2xl text-paper-deep/80">
            The roadmap works only if the first artifact exists by the end of this week.
          </p>
          <Link
            to="/phases/$phaseId"
            params={{ phaseId: '0' }}
            className="mt-6 inline-block bg-vermillion px-5 py-2.5 font-mono text-paper text-sm transition-colors hover:bg-vermillion-deep"
          >
            phase 0 — orientation →
          </Link>
        </div>
      </div>
    </main>
  )
}

/** Entry phase implied by the answers so far: first "can't" wins; all "can" → Phase 5. */
function deriveEntryPhase(answers: Record<string, boolean>): number | null {
  const firstCant = DIAGNOSTIC.find((q) => answers[q.id] === false)
  if (firstCant) return firstCant.failPhase
  return DIAGNOSTIC.every((q) => answers[q.id]) ? 5 : null
}

function Diagnostic() {
  const { entryPhase } = useProgress()
  const [answers, setAnswers] = useState<Record<string, boolean>>({})

  const allCan = DIAGNOSTIC.every((q) => answers[q.id])
  // this session's answers win; otherwise fall back to the persisted result
  const shownPhase = deriveEntryPhase(answers) ?? entryPhase

  function answer(id: string, can: boolean) {
    const next = { ...answers, [id]: can }
    setAnswers(next)
    const derived = deriveEntryPhase(next)
    if (derived !== null) setEntryPhase(derived)
  }

  return (
    <div>
      <p className="prose-note mb-8 max-w-2xl">
        Don't assume you're at zero. Start at the first thing you <em>can't</em> confidently do — by{' '}
        <strong>implementing</strong>, not "I've seen it." Most strong engineers land at Phase 1,
        move through it fast, and slow down at Phases 3–4 where the field-specific depth lives.
      </p>
      <ol className="space-y-4">
        {DIAGNOSTIC.map((q, i) => {
          const a = answers[q.id]
          return (
            <li
              key={q.id}
              className="flex flex-col gap-3 border-paper-edge border-t pt-4 sm:flex-row sm:items-start sm:justify-between"
            >
              <p className="prose-note max-w-xl">
                <span className="mr-2 font-mono text-sm text-vermillion">{i + 1}.</span>
                {q.text}
              </p>
              <div className="flex flex-none gap-2 font-mono text-xs">
                <button
                  type="button"
                  onClick={() => answer(q.id, true)}
                  className={cn(
                    'border border-paper-edge px-3 py-1.5 transition-colors',
                    a === true
                      ? 'border-moss-deep bg-moss text-paper'
                      : 'text-ink-soft hover:border-ink',
                  )}
                >
                  can do
                </button>
                <button
                  type="button"
                  onClick={() => answer(q.id, false)}
                  className={cn(
                    'border border-paper-edge px-3 py-1.5 transition-colors',
                    a === false
                      ? 'border-vermillion-deep bg-vermillion text-paper'
                      : 'text-ink-soft hover:border-ink',
                  )}
                >
                  not yet
                </button>
              </div>
            </li>
          )
        })}
      </ol>
      {(allCan || shownPhase !== null) && (
        <div className="mt-8 border-vermillion border-l-2 bg-paper-deep/50 px-5 py-4">
          {allCan ? (
            <p className="prose-note">
              <strong>All five, confidently?</strong> You're past the curriculum — go to{' '}
              <Link to="/phases/$phaseId" params={{ phaseId: '5' }} className="link-ink">
                Phase 5
              </Link>{' '}
              and ship an original result.
            </p>
          ) : (
            <p className="prose-note">
              <strong>Your entry point: Phase {shownPhase}.</strong>{' '}
              <Link
                to="/phases/$phaseId"
                params={{ phaseId: String(shownPhase) }}
                className="link-ink"
              >
                Start there →
              </Link>{' '}
              <span className="font-mono text-ink-faint text-xs">
                (saved — the phase map below marks it)
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function PhaseMap() {
  const { checked, entryPhase } = useProgress()

  return (
    <div className="space-y-0">
      {PHASES.map((phase) => {
        const { done, total } = phaseProgress(phase, checked)
        const complete = done === total
        const isEntry = entryPhase === phase.number
        return (
          <Link
            key={phase.slug}
            to="/phases/$phaseId"
            params={{ phaseId: phase.slug }}
            className={cn(
              'group grid gap-x-6 gap-y-2 border-paper-edge border-t py-5 transition-colors sm:grid-cols-[4rem_1fr_10rem]',
              'hover:bg-paper-deep/40',
              isEntry && '-mx-4 border-l-2 border-l-vermillion bg-paper-deep/50 px-4',
            )}
          >
            <div className="font-display font-light text-3xl text-ink-faint group-hover:text-vermillion">
              {phase.number}
            </div>
            <div>
              <h3 className="font-display font-semibold text-xl">
                {phase.title}
                {isEntry && (
                  <span className="ml-3 font-medium font-mono text-[0.65rem] text-vermillion uppercase tracking-widest">
                    ← start here
                  </span>
                )}
                {complete && (
                  <span className="ml-3 font-mono text-[0.65rem] text-moss uppercase tracking-widest">
                    ✓ shipped
                  </span>
                )}
              </h3>
              <p className="mt-1 text-ink-soft">{phase.tagline}</p>
              {phase.levelNote && (
                <p className="mt-1 font-mono text-[0.68rem] text-gold uppercase tracking-wider">
                  → {phase.levelNote}
                </p>
              )}
            </div>
            <div className="sm:text-right">
              <p className="font-mono text-ink-faint text-xs">{phase.weeks}</p>
              <p className="mt-1 font-mono text-ink-soft text-xs">
                {done}/{total} artifacts
              </p>
              <div className="mt-2 h-1 w-full bg-paper-edge sm:ml-auto">
                <div
                  className={cn('h-1', complete ? 'bg-moss' : 'bg-vermillion')}
                  style={{ width: `${total ? (done / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
