import { useState } from 'react'
import { fmt2 } from '@/components/attention/model'
import { Chips } from '@/components/lab/chips'
import { driftVec, layerNorm, mean, rms, rmsNorm, std } from '@/components/transformer-block/model'
import { cn } from '@/lib/utils'

const BAR_MAX = 7

function VecBars({ vec, tone }: { vec: number[]; tone: 'ink' | 'moss' }) {
  return (
    <div className="flex h-28 items-center gap-1.5">
      {vec.map((v, d) => {
        const h = (Math.min(BAR_MAX, Math.abs(v)) / BAR_MAX) * 50
        return (
          <div
            key={`d${
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed 6-dim vector; the dimension IS the identity
              d
            }`}
            className="relative h-full flex-1"
          >
            <div className="absolute inset-x-0 top-1/2 h-px bg-paper-edge" />
            <div
              className={cn(
                'absolute inset-x-1',
                v >= 0 ? 'bottom-1/2' : 'top-1/2',
                tone === 'ink' ? 'bg-ink-soft' : 'bg-moss',
              )}
              style={{ height: `${h}%` }}
            />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-mono text-[0.55rem] text-ink-faint">
              {fmt2(v)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * §2 — drift a real 6-dim vector with scale/shift sliders, watch LayerNorm
 * put it back on unit footing (and RMSNorm skip the centering).
 */
export function NormLab() {
  const [scale, setScale] = useState(2.4)
  const [shift, setShift] = useState(1.0)
  const [kind, setKind] = useState('layernorm')

  const drifted = driftVec(scale, shift)
  const normed = kind === 'layernorm' ? layerNorm(drifted) : rmsNorm(drifted)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h4 className="font-mono text-[0.68rem] text-ink-soft uppercase tracking-widest">
            the stream after some blocks — drifted
          </h4>
          <div className="mt-3">
            <VecBars vec={drifted} tone="ink" />
          </div>
          <p className="mt-2 font-mono text-[0.7rem] text-ink-faint">
            mean {fmt2(mean(drifted))} · std {fmt2(std(drifted))} · rms {fmt2(rms(drifted))}
          </p>
        </div>
        <div>
          <h4 className="font-mono text-[0.68rem] text-moss uppercase tracking-widest">
            what the next branch actually receives
          </h4>
          <div className="mt-3">
            <VecBars vec={normed} tone="moss" />
          </div>
          <p className="mt-2 font-mono text-[0.7rem] text-ink-faint">
            mean{' '}
            <span
              className={
                kind === 'rmsnorm' && Math.abs(mean(normed)) > 0.05 ? 'text-vermillion' : undefined
              }
            >
              {fmt2(mean(normed))}
            </span>{' '}
            · std {fmt2(std(normed))} · rms {fmt2(rms(normed))}
          </p>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-4 border-paper-edge border-t pt-4 sm:grid-cols-[1fr_1fr_auto]">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              scale drift <span className="text-ink-faint">· the stream grows</span>
            </span>
            <span className="text-ink">×{fmt2(scale)}</span>
          </span>
          <input
            type="range"
            min={0.2}
            max={6}
            step={0.1}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>
              shift drift <span className="text-ink-faint">· a bias creeps in</span>
            </span>
            <span className="text-ink">
              {shift >= 0 ? '+' : ''}
              {fmt2(shift)}
            </span>
          </span>
          <input
            type="range"
            min={-3}
            max={3}
            step={0.1}
            value={shift}
            onChange={(e) => setShift(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <Chips
          label="recipe"
          options={[
            { id: 'layernorm', label: 'LayerNorm' },
            { id: 'rmsnorm', label: 'RMSNorm' },
          ]}
          value={kind}
          onPick={setKind}
        />
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          {kind === 'layernorm' ? (
            <>
              <strong className="text-ink">LayerNorm</strong>: subtract the mean, divide by the std
              — drag either slider anywhere, the output is always mean 0, std 1. The next block
              starts from the same footing every time.
            </>
          ) : (
            <>
              <strong className="text-ink">RMSNorm</strong> skips the mean-centering and only
              divides by the RMS — watch the output mean stay nonzero as you drag shift. It turns
              out centering barely mattered; the cheaper recipe (Llama, most modern LLMs) trains
              just as well.
            </>
          )}
        </p>
      </div>
    </div>
  )
}
