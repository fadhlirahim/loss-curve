import { useState } from 'react'
import { Chips } from '@/components/lab/chips'
import { chunkCounts, EXAMPLES, templateChunks } from '@/components/sft/model'
import { cn } from '@/lib/utils'

/**
 * §1 — one instruction/response pair rendered into a real chat template,
 * with a working loss mask: flip it and watch which tokens carry gradient.
 */
export function ChatTemplate() {
  const [exampleId, setExampleId] = useState(EXAMPLES[0].id)
  const [masked, setMasked] = useState(true)

  const example = EXAMPLES.find((e) => e.id === exampleId) ?? EXAMPLES[0]
  const chunks = templateChunks(example, masked)
  const counts = chunkCounts(chunks)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <Chips
          label="training pair"
          options={EXAMPLES.map((e) => ({ id: e.id, label: e.label }))}
          value={example.id}
          onPick={setExampleId}
        />
        <label className="flex cursor-pointer items-center gap-2 font-mono text-ink-soft text-xs">
          <input
            type="checkbox"
            checked={masked}
            onChange={(e) => setMasked(e.target.checked)}
            className="accent-vermillion"
          />
          loss mask (train only the answer)
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-1 gap-y-1.5 border border-paper-edge bg-paper-bright p-4">
        {chunks.map((c, i) => (
          <span
            key={`${c.text}-${
              // biome-ignore lint/suspicious/noArrayIndexKey: chunks repeat; position is the identity
              i
            }`}
            className={cn(
              'px-1 py-0.5 font-mono text-[0.72rem] transition-opacity',
              c.kind === 'marker' && 'text-ink-faint',
              c.trained ? 'border-vermillion border-b-2 bg-vermillion/10 text-ink' : 'opacity-45',
            )}
          >
            {c.text}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1 font-mono text-[0.7rem] text-ink-faint">
        <span>
          <span className="text-vermillion">{counts.trained}</span> trained · {counts.context}{' '}
          context-only · {counts.total} total
        </span>
        <span>
          underlined = carries gradient. note the final im_end is trained — that's how the model
          learns to stop.
        </span>
      </div>

      <div
        className={cn(
          'mt-4 border-l-2 px-4 py-3',
          masked ? 'border-vermillion bg-paper-bright' : 'border-gold bg-paper-bright',
        )}
      >
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          {masked ? (
            example.verdict
          ) : (
            <>
              Mask off: the model now spends capacity learning to imitate <em>users</em> and
              template boilerplate. It will happily hallucinate your side of the conversation — this
              is why every SFT framework masks the prompt by default.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
