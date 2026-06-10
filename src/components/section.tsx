import type { ReactNode } from 'react'

export function Section({
  label,
  title,
  children,
}: {
  label: string
  title?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="mx-auto w-full max-w-4xl px-6 py-14 sm:px-10">
      <p className="overline">{label}</p>
      {title && (
        <h2 className="mt-3 max-w-2xl font-display font-medium text-3xl leading-tight tracking-tight sm:text-4xl">
          {title}
        </h2>
      )}
      <div className="mt-8">{children}</div>
    </section>
  )
}
