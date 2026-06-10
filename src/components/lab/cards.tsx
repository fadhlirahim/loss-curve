import { Tex } from '@/components/tex'

/** The labs' takeaway grid: a named rule, optionally its formula, and the why. */
export function RuleCards({ items }: { items: { rule: string; tex?: string; why: string }[] }) {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {items.map(({ rule, tex, why }) => (
        <div key={rule} className="border border-paper-edge bg-paper-deep/30 p-5">
          <h3 className="font-display font-semibold">{rule}</h3>
          {tex && <Tex block tex={tex} className="mt-3 text-[0.9rem] text-ink" />}
          <p className="mt-2 font-mono text-[0.78rem] text-ink-soft leading-relaxed">{why}</p>
        </div>
      ))}
    </div>
  )
}

/**
 * One-click experiment presets. `onLoad` applies the setup (and should
 * start training); the card then scrolls the lab back into view.
 */
export function ExperimentCards<T>({
  items,
  onLoad,
}: {
  items: { title: string; story: string; setup: T }[]
  onLoad: (setup: T) => void
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((ex) => (
        <div key={ex.title} className="flex flex-col border border-paper-edge bg-paper-deep/30 p-5">
          <h3 className="font-display font-semibold">{ex.title}</h3>
          <p className="mt-2 flex-1 text-[0.95rem] text-ink-soft leading-relaxed">{ex.story}</p>
          <button
            type="button"
            onClick={() => {
              onLoad(ex.setup)
              document.getElementById('lab')?.scrollIntoView({ behavior: 'smooth' })
            }}
            className="mt-4 self-start bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
          >
            load &amp; train ▸
          </button>
        </div>
      ))}
    </div>
  )
}
