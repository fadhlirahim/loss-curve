import { useState } from 'react'
import { flashScoreBytes, fmtBytes, naiveScoreBytes } from '@/components/gpu-systems/model'
import { cn } from '@/lib/utils'

const W = 640
const H = 280
const M = { top: 18, right: 20, bottom: 34, left: 58 }
const T_MIN = 10 // log2 1k
const T_MAX = 17 // log2 128k
const B_MIN = 5 // log10 bytes
const B_MAX = 11

const px = (t: number) =>
  M.left + ((Math.log2(t) - T_MIN) / (T_MAX - T_MIN)) * (W - M.left - M.right)
const py = (b: number) =>
  H -
  M.bottom -
  ((Math.log10(Math.max(b, 10 ** B_MIN)) - B_MIN) / (B_MAX - B_MIN)) * (H - M.top - M.bottom)

const curve = (fn: (t: number) => number) => {
  const pts: string[] = []
  for (let e = T_MIN; e <= T_MAX; e += 0.25) {
    const t = 2 ** e
    pts.push(`${px(t).toFixed(1)},${py(fn(t)).toFixed(1)}`)
  }
  return pts.join(' ')
}

export function FlashPlot() {
  const [tExp, setTExp] = useState(15)
  const [flash, setFlash] = useState(false)

  const t = 2 ** tExp
  const naive = naiveScoreBytes(t)
  const flashB = flashScoreBytes(t)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <label className="block min-w-56 flex-1 font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>sequence length T</span>
            <span className="text-ink tabular-nums">{t.toLocaleString()}</span>
          </span>
          <input
            type="range"
            min={T_MIN}
            max={T_MAX}
            step={1}
            value={tExp}
            onChange={(e) => setTExp(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 font-mono text-ink-soft text-xs">
          <input
            type="checkbox"
            checked={flash}
            onChange={(e) => setFlash(e.target.checked)}
            className="accent-vermillion"
          />
          FlashAttention
        </label>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[480px]"
          role="img"
          aria-label="Attention memory vs sequence length"
        >
          {[10, 12, 14, 16].map((e) => (
            <g key={`x${e}`}>
              <line
                x1={px(2 ** e)}
                y1={M.top}
                x2={px(2 ** e)}
                y2={H - M.bottom}
                stroke="var(--color-paper-edge)"
                strokeWidth="1"
              />
              <text
                x={px(2 ** e)}
                y={H - M.bottom + 16}
                textAnchor="middle"
                className="fill-ink-faint font-mono text-[9px]"
              >
                {(2 ** e / 1024).toFixed(0)}k
              </text>
            </g>
          ))}
          {[5, 7, 9, 11].map((e) => (
            <g key={`y${e}`}>
              <line
                x1={M.left}
                y1={py(10 ** e)}
                x2={W - M.right}
                y2={py(10 ** e)}
                stroke="var(--color-paper-edge)"
                strokeWidth="1"
              />
              <text
                x={M.left - 6}
                y={py(10 ** e) + 3}
                textAnchor="end"
                className="fill-ink-faint font-mono text-[9px]"
              >
                {e === 5 ? '100KB' : e === 7 ? '10MB' : e === 9 ? '1GB' : '100GB'}
              </text>
            </g>
          ))}
          <polyline
            points={curve(naiveScoreBytes)}
            fill="none"
            stroke="var(--color-vermillion)"
            strokeWidth="2"
            opacity={flash ? 0.3 : 1}
          />
          <polyline
            points={curve(flashScoreBytes)}
            fill="none"
            stroke="var(--color-moss)"
            strokeWidth="2"
            opacity={flash ? 1 : 0.3}
          />
          <text
            x={px(2 ** 14)}
            y={py(naiveScoreBytes(2 ** 14)) - 8}
            className="fill-vermillion font-mono text-[9px]"
          >
            naive · T² scores materialized
          </text>
          <text
            x={px(2 ** 13.6)}
            y={py(flashScoreBytes(2 ** 13.6)) - 8}
            className="fill-moss font-mono text-[9px]"
          >
            flash · O(T) running stats
          </text>
          <circle
            cx={px(t)}
            cy={py(flash ? flashB : naive)}
            r="6"
            fill={flash ? 'var(--color-moss)' : 'var(--color-vermillion)'}
            stroke="var(--color-paper-bright)"
            strokeWidth="2"
          />
          <text
            x={(M.left + W - M.right) / 2}
            y={H - 4}
            textAnchor="middle"
            className="fill-ink-soft font-mono text-[10px]"
          >
            sequence length (log) — score-matrix memory, one head, bf16
          </text>
        </svg>
      </div>

      <div className={cn('mt-4 border-l-2 px-4 py-3', 'border-vermillion bg-paper-bright')}>
        <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
          at T = {t.toLocaleString()} · naive {fmtBytes(naive)} vs flash {fmtBytes(flashB)} — per
          head
        </p>
        <p className="mt-1.5 max-w-2xl text-[0.88rem] text-ink-soft leading-relaxed">
          The trick is <strong className="text-ink">tiling + online softmax</strong>: stream Q and K
          through fast on-chip SRAM in blocks, keep a running row-max and row-sum, and rescale the
          partial output as each block arrives. The T×T matrix is still <em>computed</em> — it's
          just never <em>written</em> to HBM. Same FLOPs, exact same answer (it is not an
          approximation), a fraction of the bytes — which is the whole game on a memory-bound op.
        </p>
      </div>
    </div>
  )
}
