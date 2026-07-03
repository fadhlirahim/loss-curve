import { useState } from 'react'
import { fmt2 } from '@/components/attention/model'
import {
  MAX_POSITION,
  POS_DIMS,
  POS_EMB,
  SAMPLE_TOKEN,
  TRAINED_POSITIONS,
  untrainedNoise,
} from '@/components/positions/model'
import { cn } from '@/lib/utils'

const BAR_SCALE = 2.2

function Bar({ value, className }: { value: number; className: string }) {
  return (
    <span className="relative h-2.5 flex-1 bg-paper-deep">
      <span
        className={cn('absolute inset-y-0 left-0', className)}
        style={{ width: `${Math.min(100, (Math.abs(value) / BAR_SCALE) * 100)}%` }}
      />
    </span>
  )
}

/**
 * §2 — learned absolute positions: a trainable vector per slot, added to
 * the token embedding. Slide past the trained range and the table has
 * nothing for you — extrapolation fails by construction.
 */
export function LearnedPanel() {
  const [pos, setPos] = useState(3)

  const trained = pos < TRAINED_POSITIONS
  const posVec = trained ? POS_EMB[pos] : POS_DIMS.map((_, d) => untrainedNoise(pos, d))

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <label className="block max-w-sm font-mono text-xs">
        <span className="flex justify-between text-ink-soft">
          <span>sequence position of "{SAMPLE_TOKEN.label}"</span>
          <span className={trained ? 'text-ink' : 'text-gold'}>{pos}</span>
        </span>
        <input
          type="range"
          min={0}
          max={MAX_POSITION}
          step={1}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          className="mt-1 w-full accent-vermillion"
        />
        <span className="mt-1 flex justify-between text-[0.62rem] text-ink-faint">
          <span>0</span>
          <span className="text-moss">← trained (0–{TRAINED_POSITIONS - 1})</span>
          <span className="text-gold">never trained →</span>
          <span>{MAX_POSITION}</span>
        </span>
      </label>

      <div className="mt-6 space-y-2.5">
        <div className="grid grid-cols-[4.4rem_1fr_1rem_1fr_1rem_1fr] items-center gap-2 font-mono text-[0.62rem] text-ink-faint uppercase tracking-wider">
          <span />
          <span className="text-moss">token "{SAMPLE_TOKEN.label}"</span>
          <span className="text-center">+</span>
          <span className={trained ? 'text-vermillion' : 'text-gold'}>
            {trained ? `position ${pos}` : 'random init'}
          </span>
          <span className="text-center">=</span>
          <span>what the layer sees</span>
        </div>
        {POS_DIMS.map((dim, d) => (
          <div
            key={dim}
            className="grid grid-cols-[4.4rem_1fr_1rem_1fr_1rem_1fr] items-center gap-2"
          >
            <span className="text-right font-mono text-[0.68rem] text-ink-faint">{dim}</span>
            <Bar value={SAMPLE_TOKEN.vec[d]} className="bg-moss" />
            <span className="text-center font-mono text-[0.68rem] text-ink-faint">+</span>
            <Bar value={posVec[d]} className={trained ? 'bg-vermillion' : 'bg-gold'} />
            <span className="text-center font-mono text-[0.68rem] text-ink-faint">=</span>
            <span className="flex flex-1 items-center gap-2">
              <Bar value={SAMPLE_TOKEN.vec[d] + posVec[d]} className="bg-ink" />
              <span className="w-10 font-mono text-[0.65rem] text-ink tabular-nums">
                {fmt2(SAMPLE_TOKEN.vec[d] + posVec[d])}
              </span>
            </span>
          </div>
        ))}
      </div>

      <div
        className={cn(
          'mt-6 border-l-2 px-4 py-3',
          trained ? 'border-vermillion bg-paper-bright' : 'border-gold bg-paper-bright',
        )}
      >
        <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
          {trained ? (
            <>
              Slot {pos} has a <strong className="text-ink">trained vector</strong> — during
              training, "{SAMPLE_TOKEN.label}" appeared here often enough for the table to learn
              what "position {pos}" feels like. Content and position share the same channels;
              downstream layers learn to disentangle the sum.
            </>
          ) : (
            <>
              Slot {pos} was <strong className="text-gold">never seen in training</strong> — the
              table has only whatever random init left there. The model doesn't degrade gracefully
              past its trained length; it reads <em>noise</em>. This is why learned absolute
              positions can't extrapolate.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
