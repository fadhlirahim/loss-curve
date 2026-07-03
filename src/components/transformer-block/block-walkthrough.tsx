import { Fragment, useState } from 'react'
import { BLOCK_STEPS } from '@/components/transformer-block/model'
import { cn } from '@/lib/utils'

/** Which steps sit inside a residual branch (drawn under the skip arc). */
const BRANCH_IDS = new Set(['ln1', 'attn', 'ln2', 'mlp'])

/**
 * §4 — the assembled block as a step-through: x → LN → Attn → ⊕ → LN → MLP → ⊕ → out,
 * one piece per click, with a ticker explaining why each is there.
 */
export function BlockWalkthrough() {
  const [stepIdx, setStepIdx] = useState(-1)

  const step = stepIdx >= 0 ? BLOCK_STEPS[stepIdx] : null

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* the diagram */}
      <div className="overflow-x-auto pb-1">
        <div className="flex w-max items-center gap-1.5 py-2 sm:gap-2">
          {BLOCK_STEPS.map((s, i) => {
            const revealed = i <= stepIdx
            const active = i === stepIdx
            const isAdd = s.id.startsWith('add')
            return (
              <Fragment key={s.id}>
                {i > 0 && (
                  <span
                    className={cn('font-mono text-xs', revealed ? 'text-ink' : 'text-ink-faint/50')}
                  >
                    →
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setStepIdx(i)}
                  className={cn(
                    'border px-2.5 py-2 font-mono text-[0.7rem] transition-colors sm:px-3',
                    isAdd && 'rounded-full px-2 sm:px-2.5',
                    active
                      ? 'border-vermillion bg-vermillion text-paper'
                      : revealed
                        ? 'border-ink bg-paper-bright text-ink'
                        : 'border-paper-edge border-dashed text-ink-faint hover:border-ink',
                    BRANCH_IDS.has(s.id) && !active && 'bg-paper-deep/60',
                  )}
                >
                  {s.box}
                </button>
              </Fragment>
            )
          })}
        </div>
      </div>
      <p className="font-mono text-[0.65rem] text-ink-faint">
        boxes = the two branches · circles = the residual stream absorbing their edits
      </p>

      {/* controls */}
      <div className="mt-5 flex flex-wrap items-center gap-3 border-paper-edge border-t pt-5">
        <button
          type="button"
          onClick={() => setStepIdx((i) => Math.min(BLOCK_STEPS.length - 1, i + 1))}
          disabled={stepIdx >= BLOCK_STEPS.length - 1}
          className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion disabled:opacity-40 disabled:hover:bg-ink"
        >
          {stepIdx === -1 ? 'walk the block →' : 'step →'}
        </button>
        <button
          type="button"
          onClick={() => setStepIdx((i) => Math.max(-1, i - 1))}
          disabled={stepIdx === -1}
          className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          ← back
        </button>
        <button
          type="button"
          onClick={() => setStepIdx(-1)}
          disabled={stepIdx === -1}
          className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          reset
        </button>
        <span className="font-mono text-ink-faint text-xs">
          {stepIdx + 1}/{BLOCK_STEPS.length} pieces
        </span>
      </div>

      {/* ticker */}
      <div
        className={cn(
          'mt-4 border-l-2 px-4 py-3',
          step ? 'border-vermillion bg-paper-bright' : 'border-paper-edge',
        )}
      >
        {step ? (
          <>
            <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
              {stepIdx + 1} · {step.name}
            </p>
            <p className="mt-2 max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
              {step.note}
            </p>
          </>
        ) : (
          <p className="font-mono text-ink-faint text-xs">
            the block, unassembled — press start and walk through it piece by piece, left to right.
            every GPT layer you will ever meet is this exact sequence.
          </p>
        )}
      </div>
    </div>
  )
}
