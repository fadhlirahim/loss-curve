import { cn } from '@/lib/utils'

/** A plain entry, or a `[label, detail]` pair rendered as "**label.** detail". */
type BulletItem = string | readonly [string, string]

export function BulletList({
  items,
  className,
  itemClassName,
}: {
  items: readonly BulletItem[]
  className?: string
  itemClassName?: string
}) {
  return (
    <ul className={cn('max-w-2xl space-y-4', className)}>
      {items.map((item) => {
        const [label, detail] = typeof item === 'string' ? [undefined, item] : item
        return (
          <li key={label ?? detail} className={cn('prose-note flex gap-4', itemClassName)}>
            <span className="text-vermillion">—</span>
            <span>
              {label && <strong>{label}.</strong>} {detail}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
