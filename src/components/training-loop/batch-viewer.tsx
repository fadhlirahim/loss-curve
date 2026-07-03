import { useState } from 'react'
import {
  CORPUS,
  idsToChars,
  sampleBatch,
  TRAIN_IDS,
  VOCAB_SIZE,
} from '@/components/training-loop/model'
import { cn } from '@/lib/utils'

/**
 * §1 — dice the corpus into a batch. B and T are the two dials that decide
 * how many "given everything left of me, guess me" exams one step grades.
 */
export function BatchViewer() {
  const [b, setB] = useState(4)
  const [t, setT] = useState(8)
  const [tick, setTick] = useState(0)

  const batch = sampleBatch(TRAIN_IDS, b, t, tick)
  const covered = new Set(
    batch.starts.flatMap((s) => Array.from({ length: t + 1 }, (_, i) => s + i)),
  )

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* the corpus, sampled windows lit */}
      <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
        the whole dataset · {CORPUS.length} chars · vocab {VOCAB_SIZE}
      </p>
      <p className="mt-2 max-w-2xl font-mono text-[0.78rem] text-ink-faint leading-relaxed">
        {[...CORPUS].map((ch, i) => (
          <span
            key={`c-${
              // biome-ignore lint/suspicious/noArrayIndexKey: chars repeat; position is the identity
              i
            }`}
            className={cn(i < TRAIN_IDS.length && covered.has(i) && 'bg-vermillion/15 text-ink')}
          >
            {ch}
          </span>
        ))}
      </p>

      {/* dials */}
      <div className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>B · batch size</span>
            <span className="text-ink">{b}</span>
          </span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>T · block size</span>
            <span className="text-ink">{t}</span>
          </span>
          <input
            type="range"
            min={4}
            max={32}
            step={1}
            value={t}
            onChange={(e) => setT(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <button
          type="button"
          onClick={() => setTick((n) => n + 1)}
          className="self-end border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink"
        >
          resample ⚄
        </button>
      </div>

      {/* the batch itself */}
      <div className="mt-5 overflow-x-auto border-paper-edge border-t pt-4">
        <div className="w-max space-y-2">
          {batch.xs.map((row, bi) => (
            <div
              key={`row-${batch.starts[bi]}-${
                // biome-ignore lint/suspicious/noArrayIndexKey: rows can sample the same start; position disambiguates
                bi
              }`}
              className="flex items-end gap-[2px]"
            >
              <span className="mr-2 w-14 font-mono text-[0.6rem] text-ink-faint">
                row {bi} · @{batch.starts[bi]}
              </span>
              {idsToChars(row).map((ch, ti) => (
                <span
                  key={`cell-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: cell position is the identity
                    ti
                  }`}
                  className="flex flex-col items-center"
                >
                  <span className="flex h-7 w-7 items-center justify-center border border-paper-edge bg-paper-bright font-mono text-[0.8rem] text-ink">
                    {ch === ' ' ? '␣' : ch}
                  </span>
                  <span className="mt-[2px] font-mono text-[0.6rem] text-vermillion">
                    {idsToChars(batch.ys[bi])[ti] === ' ' ? '␣' : idsToChars(batch.ys[bi])[ti]}
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 border-paper-edge border-t pt-3 font-mono text-xs">
        <span className="text-ink">
          tokens per step = B × T = {b} × {t} = {b * t}
        </span>
        <span className="text-ink-faint">
          {' '}
          — every cell is one exam: given everything to my left, guess the vermillion char below me.
          One step grades all {b * t} at once.
        </span>
      </p>
    </div>
  )
}
