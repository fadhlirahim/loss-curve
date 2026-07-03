import { useState } from 'react'
import { fmt2, heat, RAW, RAW_MAX, TOKENS } from '@/components/attention/model'
import { cellAfterPermute, PERMUTATIONS, permutedScores } from '@/components/positions/model'
import { cn } from '@/lib/utils'

/**
 * §1 — shuffle the sentence and watch every attention score survive,
 * merely relocated with its tokens. Attention is a bag of words.
 */
export function ShuffleDemo() {
  const [permIdx, setPermIdx] = useState(0)

  const { label, order } = PERMUTATIONS[permIdx]
  const scores = permutedScores(order)
  const [hotRow, hotCol] = cellAfterPermute(order, 6, 1)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setPermIdx((p) => (p + 1) % PERMUTATIONS.length)}
          className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
        >
          shuffle the sentence →
        </button>
        <span className="font-mono text-ink-faint text-xs">
          {permIdx + 1}/{PERMUTATIONS.length} · {label}
        </span>
      </div>

      <p className="mt-4 flex flex-wrap gap-x-1.5 gap-y-2 font-mono text-[0.95rem]">
        {order.map((tok) => (
          <span
            key={`w-${tok}`}
            className={cn(
              'border border-paper-edge bg-paper-bright px-2 py-1',
              (tok === 6 || tok === 1) && 'border-vermillion text-ink',
            )}
          >
            {TOKENS[tok]}
          </span>
        ))}
      </p>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="grid w-max grid-cols-[3.8rem_repeat(9,1.7rem)] gap-[2px]">
          <div />
          {order.map((tok) => (
            <div
              key={`c-${tok}`}
              className="pb-1 text-center font-mono text-[0.52rem] text-ink-faint"
            >
              {TOKENS[tok]}
            </div>
          ))}
          {order.map((qTok, i) => (
            <div key={`r-${qTok}`} className="contents">
              <div className="flex items-center justify-end pr-2 font-mono text-[0.52rem] text-ink-faint">
                {TOKENS[qTok]}
              </div>
              {order.map((kTok, j) => (
                <span
                  key={`s-${qTok}-${kTok}`}
                  title={`q(${TOKENS[qTok]}) · k(${TOKENS[kTok]}) = ${fmt2(scores[i][j])}`}
                  className={cn(
                    'block aspect-square',
                    i === hotRow && j === hotCol && 'z-10 outline outline-2 outline-vermillion',
                  )}
                  style={{ background: heat(scores[i][j] / RAW_MAX) }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          The outlined cell is{' '}
          <strong className="text-ink">q(it) · k(bird) = {fmt2(RAW[6][1])}</strong> — every shuffle,
          same value, new address. To QKᵀ, "the bird ate the worm" and "the worm ate the bird" are{' '}
          <strong className="text-ink">the same sentence</strong>. Word order — who ate whom — has
          to come from somewhere else.
        </p>
      </div>
    </div>
  )
}
