import { Fragment } from 'react'
import { type DedupResult, type Doc, diffWords, tokenize } from '@/components/data-curation/model'
import { cn } from '@/lib/utils'

function PairText({ doc, other }: { doc: Doc; other: Doc }) {
  const diff = diffWords(doc, other)
  return (
    <p className="font-mono text-[0.7rem] text-ink-soft leading-relaxed">
      {tokenize(doc.text).map((w, i) => (
        <Fragment
          key={`${doc.id}-${w}-${
            // biome-ignore lint/suspicious/noArrayIndexKey: words repeat; position is the identity
            i
          }`}
        >
          {i > 0 && ' '}
          <span className={cn(diff.has(w) && 'bg-vermillion/20 text-ink')}>{w}</span>
        </Fragment>
      ))}
    </p>
  )
}

/**
 * §3 — exact dedup by hash, near-dedup by 3-gram Jaccard with a live
 * threshold. Caught pairs are shown side by side, differences highlighted.
 */
export function DedupPanel({
  result,
  threshold,
  onThreshold,
}: {
  result: DedupResult
  threshold: number
  onThreshold: (t: number) => void
}) {
  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <label className="block min-w-56 font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>near-dup threshold · jaccard ≥</span>
            <span className="text-ink">{threshold.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.3}
            max={1}
            step={0.01}
            value={threshold}
            onChange={(e) => onThreshold(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <p className="font-mono text-ink-faint text-xs">
          exact copies caught: {result.exactDrops.length} · near-duplicates caught:{' '}
          {result.nearDrops.length}
        </p>
      </div>

      {/* exact copies */}
      <div className="mt-5 border-paper-edge border-t pt-4">
        {result.exactDrops.map(({ doc, of }) => (
          <p key={doc.id} className="font-mono text-ink-soft text-xs">
            <span className="text-vermillion">{doc.id}</span> is a byte-identical copy of{' '}
            <span className="text-ink">{of.id}</span> — dropped by hash, no similarity math needed.
          </p>
        ))}
      </div>

      {/* near-dup pairs */}
      {result.nearDrops.map(({ doc, of, sim }) => (
        <div
          key={doc.id}
          className="mt-4 grid gap-3 border-paper-edge border-t pt-4 sm:grid-cols-2"
        >
          <div>
            <p className="mb-1.5 font-mono text-[0.62rem] text-ink-faint">{of.id} · kept</p>
            <PairText doc={of} other={doc} />
          </div>
          <div>
            <p className="mb-1.5 font-mono text-[0.62rem] text-vermillion">
              {doc.id} · dropped — {(sim * 100).toFixed(0)}% similar
            </p>
            <PairText doc={doc} other={of} />
          </div>
        </div>
      ))}

      <div className="mt-5 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          Duplicates are poison three ways: the model{' '}
          <strong className="text-ink">memorizes</strong> repeated text instead of learning from it,
          benchmark answers hiding in duplicated pages{' '}
          <strong className="text-ink">contaminate</strong> your evals, and every copy{' '}
          <strong className="text-ink">skews the distribution</strong> toward one document's words —
          §4 measures that skew directly. Drag the threshold down and watch it get greedy; real
          pipelines tune this on samples, at MinHash scale.
        </p>
      </div>
    </div>
  )
}
