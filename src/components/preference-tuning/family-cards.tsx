import { FAMILY } from '@/components/preference-tuning/model'

/** §4 — RLHF vs DPO vs GRPO, one honest row each. */
export function FamilyCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-3">
      {FAMILY.map((method) => (
        <div key={method.name} className="border border-paper-edge bg-paper-deep/30 p-5">
          <h3 className="font-display font-semibold text-lg">{method.name}</h3>
          <dl className="mt-3 space-y-3">
            <div>
              <dt className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
                what it eats
              </dt>
              <dd className="mt-1 text-[0.85rem] text-ink-soft leading-relaxed">{method.eats}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
                extra models it needs
              </dt>
              <dd className="mt-1 text-[0.85rem] text-ink-soft leading-relaxed">{method.needs}</dd>
            </div>
            <div>
              <dt className="font-mono text-[0.62rem] text-vermillion uppercase tracking-widest">
                what goes wrong
              </dt>
              <dd className="mt-1 text-[0.85rem] text-ink-soft leading-relaxed">{method.breaks}</dd>
            </div>
          </dl>
        </div>
      ))}
    </div>
  )
}
