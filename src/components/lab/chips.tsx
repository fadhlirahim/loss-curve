import { cn } from '@/lib/utils'

/** A labeled row of mutually-exclusive choice chips — the labs' standard knob. */
export function Chips({
  label,
  options,
  value,
  onPick,
}: {
  label: string
  options: { id: string; label: string }[]
  value: string
  onPick: (id: string) => void
}) {
  return (
    <div className="font-mono text-xs">
      <p className="text-[0.65rem] text-ink-faint uppercase tracking-widest">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => onPick(o.id)}
            className={cn(
              'border px-3 py-1.5 transition-colors',
              o.id === value
                ? 'border-vermillion-deep bg-vermillion text-paper'
                : 'border-paper-edge text-ink-soft hover:border-ink',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
