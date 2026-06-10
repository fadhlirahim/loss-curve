import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { GLOSSARY } from '@/data/glossary'

export const Route = createFileRoute('/glossary')({
  head: () => ({ meta: [{ title: 'Jargon decoder · Roadmap to Mastery' }] }),
  component: GlossaryPage,
})

function GlossaryPage() {
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return GLOSSARY
    return GLOSSARY.map((g) => ({
      ...g,
      terms: g.terms.filter(
        (t) => t.term.toLowerCase().includes(q) || t.plain.toLowerCase().includes(q),
      ),
    })).filter((g) => g.terms.length > 0)
  }, [query])

  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-20 sm:px-10">
      <div className="pt-16 pb-10">
        <p className="rise overline">Plain words · for a smart twelve-year-old</p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Jargon decoder
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          Every field hides behind its vocabulary. Here's this one's, grouped by theme so each group
          reads as a tiny story. If a sentence anywhere on this site loses you, look the word up
          here and go back.
        </p>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="grep the vocabulary…"
          className="rise rise-3 mt-8 w-full max-w-md border border-paper-edge bg-paper-bright px-4 py-2.5 font-mono text-ink text-sm placeholder:text-ink-faint focus:border-vermillion focus:outline-none"
        />
      </div>

      {groups.length === 0 && (
        <p className="font-mono text-ink-faint text-sm">no matches — try a shorter query.</p>
      )}

      <div className="space-y-14">
        {groups.map((group) => (
          <section key={group.title}>
            <p className="overline">{group.title}</p>
            <dl className="mt-6 space-y-0">
              {group.terms.map((t) => (
                <div
                  key={t.term}
                  className="grid gap-x-8 gap-y-1 border-paper-edge border-t py-4 sm:grid-cols-[14rem_1fr]"
                >
                  <dt className="font-display font-semibold">{t.term}</dt>
                  <dd className="prose-note text-[0.98rem]">{t.plain}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </main>
  )
}
