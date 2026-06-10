import { createFileRoute, Link, notFound } from '@tanstack/react-router'
import { CheckRow } from '@/components/check-row'
import { PHASES, phaseProgress } from '@/data/roadmap'
import { useProgress } from '@/hooks/use-progress'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/phases/$phaseId')({
  loader: ({ params }) => {
    const phase = PHASES.find((p) => p.slug === params.phaseId)
    if (!phase) throw notFound()
    return { phase }
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Phase ${loaderData.phase.number} — ${loaderData.phase.title} · Roadmap to Mastery`
          : 'Roadmap to Mastery',
      },
    ],
  }),
  component: PhasePage,
})

function PhasePage() {
  const { phase } = Route.useLoaderData()
  const { checked } = useProgress()
  const { done, total } = phaseProgress(phase, checked)
  const prev = PHASES.find((p) => p.number === phase.number - 1)
  const next = PHASES.find((p) => p.number === phase.number + 1)

  return (
    <main className="mx-auto w-full max-w-4xl px-6 sm:px-10">
      {/* phase rail */}
      <nav className="flex gap-1 pt-8 font-mono text-xs" aria-label="Phases">
        {PHASES.map((p) => {
          const pp = phaseProgress(p, checked)
          const isCurrent = p.slug === phase.slug
          return (
            <Link
              key={p.slug}
              to="/phases/$phaseId"
              params={{ phaseId: p.slug }}
              className={cn(
                'flex-1 border-t-4 pt-2 text-center transition-colors',
                isCurrent
                  ? 'border-vermillion text-vermillion'
                  : pp.done === pp.total
                    ? 'border-moss text-moss hover:text-moss-deep'
                    : 'border-paper-edge text-ink-faint hover:border-ink-faint hover:text-ink',
              )}
            >
              {p.number}
            </Link>
          )
        })}
      </nav>

      {/* header */}
      <header className="pt-12 pb-4">
        <p className="rise overline">
          Phase {phase.number} · {phase.weeks}
          {phase.levelNote && <span className="ml-3 text-gold">→ {phase.levelNote}</span>}
        </p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl leading-tight tracking-tight sm:text-5xl">
          {phase.title}
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">{phase.goal}</p>
        <aside className="rise rise-3 mt-6 max-w-2xl border-paper-edge border-l-2 pl-5 text-[0.95rem] text-ink-faint italic leading-relaxed">
          The gap this closes — {phase.gap}
        </aside>
      </header>

      {/* what to learn */}
      <section className="py-10">
        <p className="overline">What to learn · in priority order</p>
        <ol className="mt-6 space-y-5">
          {phase.learn.map((item, i) => (
            <li key={item.title} className="flex gap-5">
              <span className="font-mono text-sm text-vermillion">{i + 1}</span>
              <div>
                <h3 className="font-display font-semibold text-lg">{item.title}</h3>
                <p className="prose-note mt-0.5">{item.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <hr className="rule" />

      {/* primary path */}
      <section className="py-10">
        <p className="overline">Primary path · use these, not ten others</p>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {phase.path.map((item) => (
            <div key={item.title} className="border border-paper-edge bg-paper-deep/30 p-5">
              <h3 className="font-display font-semibold leading-snug">
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noreferrer" className="link-ink">
                    {item.title} ↗
                  </a>
                ) : (
                  item.title
                )}
              </h3>
              <p className="mt-2 text-[0.95rem] text-ink-soft leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <hr className="rule" />

      {/* deliverable */}
      <section className="py-10">
        <p className="overline">The deliverable</p>
        <p className="mt-4 max-w-2xl font-display font-medium text-xl leading-relaxed">
          {phase.deliverable}
        </p>
      </section>

      <hr className="rule" />

      {/* checklist */}
      <section className="py-10">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <p className="overline">Milestones · check only when you can do it from a blank file</p>
          <span className="font-mono text-ink-faint text-xs">
            {done}/{total} shipped
          </span>
        </div>
        <div className="mt-6 space-y-4">
          {phase.milestones.map((m) => (
            <CheckRow key={m.id} id={m.id} text={m.text} />
          ))}
        </div>
        <p
          className={cn(
            'mt-6 border-l-2 py-2 pl-5 font-mono text-xs',
            done === total ? 'border-moss text-moss-deep' : 'border-paper-edge text-ink-faint',
          )}
        >
          artifact: {phase.artifact}
          {done === total && ' ✓'}
        </p>
        <p className="mt-3 max-w-2xl font-mono text-[0.7rem] text-ink-faint leading-relaxed">
          rule: every phase must end with a public artifact (repo + writeup). no artifact → phase
          not done, regardless of what you've watched.
        </p>
      </section>

      <hr className="rule" />

      {/* traps */}
      <section className="py-10">
        <p className="overline">Traps</p>
        <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {phase.traps.map((t) => (
            <div key={t.title}>
              <h3 className="font-display font-semibold">
                <span className="mr-2 text-vermillion">✗</span>
                {t.title}
              </h3>
              <p className="prose-note mt-1 text-[0.95rem]">{t.detail}</p>
            </div>
          ))}
        </div>
      </section>

      {/* prev / next */}
      <nav className="flex items-baseline justify-between gap-4 border-paper-edge border-t py-10 font-mono text-sm">
        {prev ? (
          <Link to="/phases/$phaseId" params={{ phaseId: prev.slug }} className="link-ink">
            ← phase {prev.number} · {prev.title.toLowerCase()}
          </Link>
        ) : (
          <Link to="/" className="link-ink">
            ← overview
          </Link>
        )}
        {next ? (
          <Link to="/phases/$phaseId" params={{ phaseId: next.slug }} className="link-ink">
            phase {next.number} · {next.title.toLowerCase()} →
          </Link>
        ) : (
          <Link to="/method" className="link-ink">
            the craft that runs forever →
          </Link>
        )}
      </nav>
    </main>
  )
}
