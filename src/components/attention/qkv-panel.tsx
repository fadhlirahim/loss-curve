import { useState } from 'react'
import { DIMS, fmt2, K, Q, STORIES, TOKENS } from '@/components/attention/model'
import { Chips } from '@/components/lab/chips'

const BAR_SCALE = 1.5

function DimBars({ vec, color }: { vec: number[]; color: 'vermillion' | 'moss' }) {
  return (
    <div className="space-y-2">
      {vec.map((v, d) => (
        <div key={DIMS[d]} className="grid grid-cols-[5rem_1fr_2.4rem] items-center gap-3">
          <span className="text-right font-mono text-[0.68rem] text-ink-faint">{DIMS[d]}</span>
          <span className="relative h-2.5 bg-paper-deep">
            <span
              className={
                color === 'vermillion'
                  ? 'absolute inset-y-0 left-0 bg-vermillion'
                  : 'absolute inset-y-0 left-0 bg-moss'
              }
              style={{ width: `${(v / BAR_SCALE) * 100}%` }}
            />
          </span>
          <span className="font-mono text-[0.68rem] text-ink tabular-nums">{fmt2(v)}</span>
        </div>
      ))}
    </div>
  )
}

/**
 * §2 — pick a token, read its query ("what am I looking for?") and key
 * ("what do I advertise?") as labeled dimension bars.
 */
export function QkvPanel() {
  const [token, setToken] = useState(6)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <Chips
        label="pick a word"
        options={TOKENS.map((t, j) => ({ id: String(j), label: t }))}
        value={String(token)}
        onPick={(id) => setToken(Number(id))}
      />

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
            query — what it asks for
          </h4>
          <div className="mt-3">
            <DimBars vec={Q[token]} color="vermillion" />
          </div>
        </div>
        <div>
          <h4 className="font-mono text-[0.68rem] text-moss uppercase tracking-widest">
            key — what it advertises
          </h4>
          <div className="mt-3">
            <DimBars vec={K[token]} color="moss" />
          </div>
        </div>
      </div>

      <p className="mt-5 max-w-2xl text-[0.9rem] text-ink-faint leading-relaxed">
        <strong className="text-ink">"{TOKENS[token]}"</strong> — {STORIES[token]} A high score
        needs the <span className="text-vermillion">query</span> and a{' '}
        <span className="text-moss">key</span> to be loud on the <em>same</em> dimensions — that's
        all a dot product measures.
      </p>
    </div>
  )
}
