import {
  crossEntropy,
  DOCS,
  type Doc,
  HELD_OUT,
  topTokens,
  totalTokens,
} from '@/components/data-curation/model'

function TokenBars({ title, docs, tone }: { title: string; docs: Doc[]; tone: 'raw' | 'curated' }) {
  const top = topTokens(docs, 15)
  const max = top[0]?.count ?? 1
  return (
    <div>
      <h4
        className={
          tone === 'raw'
            ? 'font-mono text-[0.68rem] text-vermillion uppercase tracking-widest'
            : 'font-mono text-[0.68rem] text-moss uppercase tracking-widest'
        }
      >
        {title}
      </h4>
      <div className="mt-3 space-y-1">
        {top.map(({ token, count }) => (
          <div key={token} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
            <span className="truncate text-right font-mono text-[0.65rem] text-ink-soft">
              {token}
            </span>
            <span className="relative h-2 bg-paper-deep">
              <span
                className={
                  tone === 'raw'
                    ? 'absolute inset-y-0 left-0 bg-vermillion'
                    : 'absolute inset-y-0 left-0 bg-moss'
                }
                style={{ width: `${(count / max) * 100}%` }}
              />
            </span>
            <span className="font-mono text-[0.65rem] text-ink-faint tabular-nums">{count}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * §4 — the funnel readout, then the measured payoff: unigram distributions
 * and held-out cross-entropy under raw vs curated corpora.
 */
export function FunnelPanel({ filtered, kept }: { filtered: Doc[]; kept: Doc[] }) {
  const stages = [
    { label: 'raw crawl', docs: DOCS },
    { label: 'quality-filtered', docs: filtered },
    { label: 'deduplicated', docs: kept },
  ]
  const hRaw = crossEntropy(DOCS, HELD_OUT)
  const hCur = crossEntropy(kept, HELD_OUT)
  const drop = 100 * (1 - Math.exp(hCur) / Math.exp(hRaw))

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* the funnel */}
      <div className="flex flex-wrap items-stretch gap-2">
        {stages.map((s, i) => (
          <div key={s.label} className="flex items-center gap-2">
            {i > 0 && <span className="font-mono text-ink-faint text-xs">→</span>}
            <div className="border border-paper-edge bg-paper-bright px-4 py-2.5">
              <p className="font-mono text-[0.62rem] text-ink-faint uppercase tracking-widest">
                {s.label}
              </p>
              <p className="mt-0.5 font-mono text-ink text-sm tabular-nums">
                {s.docs.length} docs · {totalTokens(s.docs)} tokens
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* the distributions */}
      <div className="mt-6 grid gap-6 border-paper-edge border-t pt-5 sm:grid-cols-2">
        <TokenBars title="raw — top 15 tokens" docs={DOCS} tone="raw" />
        <TokenBars title="curated — top 15 tokens" docs={kept} tone="curated" />
      </div>

      {/* the measurement */}
      <div className="mt-6 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
          held-out test · unigram, add-one smoothed
        </p>
        <p className="mt-1.5 font-mono text-ink-soft text-xs leading-relaxed">"{HELD_OUT}"</p>
        <p className="mt-2 font-mono text-xs leading-relaxed">
          <span className="text-ink-soft">cross-entropy under raw crawl </span>
          <span className="text-vermillion">{hRaw.toFixed(2)} nats</span>
          <span className="text-ink-soft"> · under curated corpus </span>
          <span className="text-moss-deep dark:text-moss">{hCur.toFixed(2)} nats</span>
          <span className="text-ink-soft"> — the same sentence is </span>
          <strong className="text-ink">{drop.toFixed(0)}% less surprising</strong>
          <span className="text-ink-soft"> after curation, with less than half the tokens.</span>
        </p>
      </div>
    </div>
  )
}
