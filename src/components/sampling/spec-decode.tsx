import { useState } from 'react'
import { expectedTokens, fmtGb, KV_CONFIG, kvBytesPerToken } from '@/components/sampling/model'
import { cn } from '@/lib/utils'

const W = 560
const H = 200
const PAD = { l: 40, r: 16, t: 12, b: 28 }
const A_MIN = 0.5
const A_MAX = 0.99

const px = (a: number) => PAD.l + ((a - A_MIN) / (A_MAX - A_MIN)) * (W - PAD.l - PAD.r)

const CONTEXTS = [1024, 4096, 16384, 32768, 65536, 131072]

/** §4 — the Leviathan et al. expectation, plus what a token costs to remember. */
export function SpecDecode() {
  const [alpha, setAlpha] = useState(0.8)
  const [gamma, setGamma] = useState(4)
  const [ctxIdx, setCtxIdx] = useState(3)

  const expected = expectedTokens(alpha, gamma)
  const yMax = gamma + 1.4
  const py = (v: number) => H - PAD.b - (v / yMax) * (H - PAD.t - PAD.b)

  const pts: string[] = []
  for (let a = A_MIN; a <= A_MAX + 1e-9; a += 0.01) {
    pts.push(`${px(a).toFixed(1)},${py(expectedTokens(a, gamma)).toFixed(1)}`)
  }

  const ctx = CONTEXTS[ctxIdx]
  const slots = Array.from({ length: gamma + 1 }, (_, i) => i)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="min-w-[420px]"
          role="img"
          aria-label="expected tokens per target pass versus acceptance rate"
        >
          {[1, gamma + 1].map((v) => (
            <g key={v}>
              <line
                x1={PAD.l}
                y1={py(v)}
                x2={W - PAD.r}
                y2={py(v)}
                stroke="var(--color-paper-edge)"
                strokeWidth={1}
                strokeDasharray={v === gamma + 1 ? '3 3' : undefined}
              />
              <text
                x={PAD.l - 6}
                y={py(v) + 3}
                textAnchor="end"
                className="fill-ink-faint font-mono text-[9px]"
              >
                {v}×
              </text>
            </g>
          ))}
          {[0.5, 0.7, 0.9].map((a) => (
            <text
              key={a}
              x={px(a)}
              y={H - PAD.b + 16}
              textAnchor="middle"
              className="fill-ink-faint font-mono text-[9px]"
            >
              α={a}
            </text>
          ))}
          <polyline
            points={pts.join(' ')}
            fill="none"
            stroke="var(--color-vermillion)"
            strokeWidth={2}
          />
          <circle cx={px(alpha)} cy={py(expected)} r={4} fill="var(--color-vermillion)" />
          <text
            x={px(alpha)}
            y={py(expected) - 8}
            textAnchor="middle"
            className="fill-ink font-mono text-[10px]"
          >
            {expected.toFixed(2)}× per pass
          </text>
        </svg>
      </div>

      {/* draft strip: expected accepted prefix at the current settings */}
      <div className="mt-3 flex items-center gap-1">
        {slots.map((i) => {
          const fill = Math.max(0, Math.min(1, expected - i))
          return (
            <span
              key={i}
              className="relative h-6 w-10 border border-paper-edge bg-paper-bright"
              title={i < gamma ? `draft token ${i + 1}` : 'bonus token from the target pass'}
            >
              <span
                className={cn('absolute inset-y-0 left-0', i < gamma ? 'bg-moss' : 'bg-vermillion')}
                style={{ width: `${fill * 100}%` }}
              />
            </span>
          )
        })}
        <span className="ml-2 font-mono text-[0.68rem] text-ink-faint">
          γ drafts (moss) + the target's own token (vermillion) · expected keep ={' '}
          {expected.toFixed(2)}
        </span>
      </div>

      <div className="mt-5 grid gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-2">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>α · draft/target agreement</span>
            <span className="text-ink">{alpha.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={A_MIN}
            max={0.95}
            step={0.01}
            value={alpha}
            onChange={(e) => setAlpha(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>γ · draft length</span>
            <span className="text-ink">{gamma}</span>
          </span>
          <input
            type="range"
            min={1}
            max={8}
            step={1}
            value={gamma}
            onChange={(e) => setGamma(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
      </div>

      {/* the memory-bound punchline + KV cache */}
      <div className="mt-5 border-paper-edge border-t pt-4">
        <label className="block max-w-sm font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>context length · {KV_CONFIG.label}</span>
            <span className="text-ink">{ctx.toLocaleString()} tokens</span>
          </span>
          <input
            type="range"
            min={0}
            max={CONTEXTS.length - 1}
            step={1}
            value={ctxIdx}
            onChange={(e) => setCtxIdx(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <p className="mt-2 font-mono text-ink-soft text-xs">
          KV cache = 2 · {KV_CONFIG.layers} layers · {KV_CONFIG.dModel} dims · 2 B ={' '}
          {(kvBytesPerToken / 1024).toFixed(0)} KB/token →{' '}
          <span className="text-ink tabular-nums">{fmtGb(ctx * kvBytesPerToken)}</span> at this
          context — memory the GPU re-reads for every single generated token.
        </p>
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          Two honest facts: the output distribution is <strong className="text-ink">exactly</strong>{' '}
          the target model's — rejected drafts are resampled so the math is lossless, not
          approximate. And the trick only pays because decode is{' '}
          <strong className="text-ink">memory-bound</strong>: verifying γ tokens in one forward pass
          re-reads the same weights once instead of γ times — the roofline from the GPU-systems lab,
          cashed in.
        </p>
      </div>
    </div>
  )
}
