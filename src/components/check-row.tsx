import { toggleItem, useProgress } from '@/hooks/use-progress'
import { cn } from '@/lib/utils'

export function CheckRow({
  id,
  text,
  className,
}: {
  id: string
  text: string
  className?: string
}) {
  const { checked } = useProgress()
  const done = Boolean(checked[id])

  return (
    <button
      type="button"
      onClick={() => toggleItem(id)}
      data-checked={done}
      className={cn('check-row group flex w-full items-start gap-3 text-left', className)}
      aria-pressed={done}
    >
      <span className="checkbox-tile">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path
            d="M2.5 8.5l3.5 3.5 7.5-8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
      <span className="check-label text-[1.0325rem] text-ink-soft leading-relaxed transition-colors duration-150 group-hover:text-ink">
        {text}
      </span>
    </button>
  )
}
