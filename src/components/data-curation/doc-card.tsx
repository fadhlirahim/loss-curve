import { type Doc, tokenize } from '@/components/data-curation/model'
import { cn } from '@/lib/utils'

/** One crawl document: id, token count, text — dimmed with reason chips when rejected. */
export function DocCard({ doc, reasons = [] }: { doc: Doc; reasons?: string[] }) {
  const rejected = reasons.length > 0
  return (
    <div
      className={cn(
        'border border-paper-edge bg-paper-bright p-3 transition-opacity',
        rejected && 'opacity-40',
      )}
    >
      <p className="flex justify-between font-mono text-[0.62rem] text-ink-faint">
        <span>{doc.id}</span>
        <span>{tokenize(doc.text).length} tokens</span>
      </p>
      <p className="mt-1.5 font-mono text-[0.72rem] text-ink-soft leading-relaxed">{doc.text}</p>
      {rejected && (
        <p className="mt-2 flex flex-wrap gap-1.5">
          {reasons.map((r) => (
            <span
              key={r}
              className="border border-vermillion/40 px-1.5 py-0.5 font-mono text-[0.6rem] text-vermillion"
            >
              {r}
            </span>
          ))}
        </p>
      )}
    </div>
  )
}
