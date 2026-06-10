import { createFileRoute } from '@tanstack/react-router'
import { BulletList } from '@/components/bullet-list'
import { HOW_TO_CHOOSE, RESOURCE_SECTIONS } from '@/data/resources'

export const Route = createFileRoute('/resources')({
  head: () => ({ meta: [{ title: 'Resources · Roadmap to Mastery' }] }),
  component: ResourcesPage,
})

function ResourcesPage() {
  return (
    <main className="mx-auto w-full max-w-4xl px-6 pb-20 sm:px-10">
      <div className="pt-16 pb-10">
        <p className="rise overline">Master list · curated, not exhaustive</p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          Resources
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          A short list you'll actually use beats a long list you won't. For any given phase, pick{' '}
          <strong>one primary</strong> resource and go deep; the others are references for when the
          primary leaves a gap. Collecting resources is procrastination; finishing one is progress.
        </p>
      </div>

      <div className="space-y-14">
        {RESOURCE_SECTIONS.map((section) => (
          <section key={section.title}>
            <p className="overline">{section.title}</p>
            {section.intro && (
              <p className="mt-3 max-w-2xl font-mono text-ink-faint text-xs leading-relaxed">
                {section.intro}
              </p>
            )}
            <div className="mt-6 space-y-0">
              {section.items.map((item) => (
                <div
                  key={item.name}
                  className="grid gap-x-6 gap-y-1 border-paper-edge border-t py-4 sm:grid-cols-[1.1fr_4.5rem_1fr]"
                >
                  <span className="font-display font-semibold leading-snug">
                    {item.href ? (
                      <a href={item.href} target="_blank" rel="noreferrer" className="link-ink">
                        {item.name} ↗
                      </a>
                    ) : (
                      item.name
                    )}
                  </span>
                  <span className="font-mono text-vermillion text-xs">{item.phase}</span>
                  <span className="text-[0.95rem] text-ink-soft leading-relaxed">{item.note}</span>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-16 border border-paper-edge bg-paper-deep/40 p-6 sm:p-8">
        <p className="overline">How to choose · so you don't drown</p>
        <BulletList
          className="mt-5 space-y-3"
          itemClassName="text-[0.95rem]"
          items={HOW_TO_CHOOSE}
        />
      </div>
    </main>
  )
}
