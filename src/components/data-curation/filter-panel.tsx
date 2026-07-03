import { DocCard } from '@/components/data-curation/doc-card'
import {
  DOCS,
  FILTERS,
  type FilterState,
  rejectReasons,
  totalTokens,
} from '@/components/data-curation/model'

/**
 * §2 — five real heuristics with live thresholds. Every document shows its
 * pass/reject state and the exact score that killed it.
 */
export function FilterPanel({
  state,
  onChange,
}: {
  state: FilterState
  onChange: (next: FilterState) => void
}) {
  const survivors = DOCS.filter((d) => rejectReasons(d, state).length === 0)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* threshold dials */}
      <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
        {FILTERS.map((f) => {
          const { on, t } = state[f.key]
          return (
            <label key={f.key} className="block font-mono text-xs">
              <span className="flex items-center justify-between gap-2 text-ink-soft">
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={(e) => onChange({ ...state, [f.key]: { on: e.target.checked, t } })}
                    className="accent-vermillion"
                  />
                  {f.label} {f.dir === 'min' ? '≥' : '≤'}
                </span>
                <span className="text-ink">{f.key === 'minWords' ? t : t.toFixed(2)}</span>
              </span>
              <input
                type="range"
                min={f.min}
                max={f.max}
                step={f.step}
                value={t}
                disabled={!on}
                onChange={(e) => onChange({ ...state, [f.key]: { on, t: Number(e.target.value) } })}
                className="mt-1 w-full accent-vermillion disabled:opacity-30"
              />
              <span className="text-[0.62rem] text-ink-faint">{f.hint}</span>
            </label>
          )
        })}
      </div>

      {/* the crawl, judged */}
      <div className="mt-5 grid gap-3 border-paper-edge border-t pt-5 sm:grid-cols-2">
        {DOCS.map((doc) => (
          <DocCard key={doc.id} doc={doc} reasons={rejectReasons(doc, state)} />
        ))}
      </div>

      <p className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3 font-mono text-ink-soft text-xs">
        {survivors.length}/{DOCS.length} documents pass · {totalTokens(survivors)} of{' '}
        {totalTokens(DOCS)} tokens survive. tighten mean word length past 2.95 and watch doc-13 —
        honest prose — die with the junk. every threshold is a tradeoff you own.
      </p>
    </div>
  )
}
