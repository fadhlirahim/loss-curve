import katex from 'katex'
import { cn } from '@/lib/utils'

/**
 * KaTeX-rendered math. Renders to a static HTML string on both server and
 * client, so it SSRs and hydrates without any client-side typesetting pass.
 */
export function Tex({
  tex,
  block = false,
  className,
}: {
  tex: string
  block?: boolean
  className?: string
}) {
  const html = katex.renderToString(tex, { throwOnError: false, displayMode: block })
  const Tag = block ? 'div' : 'span'
  return (
    <Tag
      className={cn(block && 'overflow-x-auto py-1', className)}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: KaTeX output from our own literal TeX strings, no user input
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
