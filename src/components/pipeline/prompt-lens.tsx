import { useState } from 'react'
import { Chips } from '@/components/lab/chips'
import { OUTPUTS, PROMPT, STAGES, type StageId } from '@/components/pipeline/model'

/**
 * §2 — one prompt, viewed through every stage of the pipeline. The outputs
 * are hand-written illustrations of each stage's characteristic behavior.
 */
export function PromptLens() {
  const [selected, setSelected] = useState<StageId>('pretrain')

  const output = OUTPUTS[selected]

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <Chips
        label="ask the model after…"
        options={STAGES.map((s) => ({ id: s.id, label: s.name }))}
        value={selected}
        onPick={(id) => setSelected(id as StageId)}
      />

      <p className="mt-6 font-mono text-[0.85rem] text-ink">
        <span className="text-ink-faint">&gt; </span>
        {PROMPT}
      </p>

      <div className="mt-3 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="font-mono text-[0.65rem] text-vermillion uppercase tracking-widest">
          {output.label}
        </p>
        {output.kind === 'text' ? (
          <p className="mt-2 max-w-2xl font-mono text-[0.85rem] text-ink leading-relaxed">
            {selected !== 'sft' && <span className="text-ink-faint">…{PROMPT} </span>}
            {output.text}
            {selected !== 'sft' && <span className="text-ink-faint"> ▌</span>}
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {output.rows.map((row) => (
              <div
                key={row.metric}
                className="grid gap-x-5 gap-y-0.5 font-mono text-[0.78rem] sm:grid-cols-[15rem_8rem_1fr]"
              >
                <span className="text-ink-soft">{row.metric}</span>
                <span className="text-moss-deep tabular-nums dark:text-moss">{row.value}</span>
                <span className="text-ink-faint">{row.comment}</span>
              </div>
            ))}
          </div>
        )}
        <p className="mt-3 max-w-2xl text-[0.88rem] text-ink-soft leading-relaxed">{output.note}</p>
      </div>
    </div>
  )
}
