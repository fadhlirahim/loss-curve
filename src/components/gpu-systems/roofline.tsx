import { useState } from 'react'
import {
  achievedFlops,
  attentionScoresOp,
  elementwiseOp,
  fmtFlops,
  fmtIntensity,
  HBM_BW,
  intensity,
  matmulOp,
  PEAK_FLOPS,
  RIDGE,
} from '@/components/gpu-systems/model'
import { Chips } from '@/components/lab/chips'

const W = 640
const H = 300
const M = { top: 18, right: 20, bottom: 34, left: 58 }
const X_MIN = -1 // log10 intensity
const X_MAX = 4
const Y_MIN = 11 // log10 FLOP/s
const Y_MAX = 15.3

const px = (i: number) =>
  M.left + ((Math.log10(i) - X_MIN) / (X_MAX - X_MIN)) * (W - M.left - M.right)
const py = (f: number) =>
  H - M.bottom - ((Math.log10(f) - Y_MIN) / (Y_MAX - Y_MIN)) * (H - M.top - M.bottom)

const OPS = [
  { id: 'matmul', label: 'matmul (M·N·K)' },
  { id: 'elementwise', label: 'elementwise add' },
  { id: 'attention', label: 'attention QKᵀ' },
]

function LogSlider({
  label,
  value,
  onChange,
  min,
  max,
  display,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  min: number
  max: number
  display: string
}) {
  return (
    <label className="block font-mono text-xs">
      <span className="flex justify-between text-ink-soft">
        <span>{label}</span>
        <span className="text-ink tabular-nums">{display}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-vermillion"
      />
    </label>
  )
}

export function Roofline() {
  const [op, setOp] = useState('matmul')
  const [mExp, setMExp] = useState(12)
  const [nExp, setNExp] = useState(12)
  const [kExp, setKExp] = useState(10)
  const [tExp, setTExp] = useState(12)

  const current =
    op === 'matmul'
      ? matmulOp(2 ** mExp, 2 ** nExp, 2 ** kExp)
      : op === 'attention'
        ? attentionScoresOp(2 ** tExp)
        : elementwiseOp(2 ** 24)
  const i = intensity(current)
  const achieved = achievedFlops(i)
  const memoryBound = i < RIDGE
  const mfu = achieved / PEAK_FLOPS

  // roof polyline: rising segment to the ridge, then flat
  const roof = [
    [px(10 ** X_MIN), py(10 ** X_MIN * HBM_BW)],
    [px(RIDGE), py(PEAK_FLOPS)],
    [px(10 ** X_MAX), py(PEAK_FLOPS)],
  ]
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
        <Chips label="operation" options={OPS} value={op} onPick={setOp} />
        <div className="space-y-2">
          {op === 'matmul' && (
            <>
              <LogSlider
                label="M"
                value={mExp}
                onChange={setMExp}
                min={6}
                max={14}
                display={String(2 ** mExp)}
              />
              <LogSlider
                label="N"
                value={nExp}
                onChange={setNExp}
                min={6}
                max={14}
                display={String(2 ** nExp)}
              />
              <LogSlider
                label="K"
                value={kExp}
                onChange={setKExp}
                min={6}
                max={14}
                display={String(2 ** kExp)}
              />
            </>
          )}
          {op === 'attention' && (
            <LogSlider
              label="sequence length T"
              value={tExp}
              onChange={setTExp}
              min={9}
              max={15}
              display={(2 ** tExp).toLocaleString()}
            />
          )}
          {op === 'elementwise' && (
            <p className="font-mono text-[0.7rem] text-ink-faint leading-relaxed">
              one add per element, three tensors of traffic — intensity is fixed at 1/6 FLOP per
              byte, no slider can save it.
            </p>
          )}
        </div>
      </div>

      <div className="mt-5 overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[480px]"
          role="img"
          aria-label="Roofline plot"
        >
          {/* grid */}
          {[-1, 0, 1, 2, 3, 4].map((e) => (
            <g key={`x${e}`}>
              <line
                x1={px(10 ** e)}
                y1={M.top}
                x2={px(10 ** e)}
                y2={H - M.bottom}
                stroke="var(--color-paper-edge)"
                strokeWidth="1"
              />
              <text
                x={px(10 ** e)}
                y={H - M.bottom + 16}
                textAnchor="middle"
                className="fill-ink-faint font-mono text-[9px]"
              >
                {e === -1 ? '0.1' : (10 ** e).toLocaleString()}
              </text>
            </g>
          ))}
          {[11, 12, 13, 14, 15].map((e) => (
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
                {e === 15 ? '1 PF' : e === 12 ? '1 TF' : `1e${e}`}
              </text>
            </g>
          ))}
          {/* the roof */}
          <polyline points={roof} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
          {/* ridge marker */}
          <line
            x1={px(RIDGE)}
            y1={M.top}
            x2={px(RIDGE)}
            y2={H - M.bottom}
            stroke="var(--color-gold)"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
          <text x={px(RIDGE) + 4} y={M.top + 10} className="fill-gold font-mono text-[9px]">
            ridge ≈ {RIDGE.toFixed(0)} FLOP/B
          </text>
          {/* the op */}
          <circle
            cx={px(i)}
            cy={py(achieved)}
            r="6"
            fill="var(--color-vermillion)"
            stroke="var(--color-paper-bright)"
            strokeWidth="2"
          />
          <text
            x={W - M.right}
            y={py(PEAK_FLOPS) - 6}
            textAnchor="end"
            className="fill-ink font-mono text-[9px]"
          >
            H100 peak · 989 TFLOP/s bf16
          </text>
          <text x={M.left + 4} y={H - M.bottom - 6} className="fill-ink-faint font-mono text-[9px]">
            slope · HBM 3.35 TB/s
          </text>
          {/* axis labels */}
          <text
            x={(M.left + W - M.right) / 2}
            y={H - 4}
            textAnchor="middle"
            className="fill-ink-soft font-mono text-[10px]"
          >
            arithmetic intensity (FLOPs per byte moved, log)
          </text>
        </svg>
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
          intensity {fmtIntensity(i)} FLOP/B · delivers {fmtFlops(achieved)} ·{' '}
          {(mfu * 100).toFixed(0)}% of peak
        </p>
        <p className="mt-1.5 max-w-2xl text-[0.88rem] text-ink-soft leading-relaxed">
          {memoryBound ? (
            <>
              <strong className="text-ink">Memory-bound.</strong> The GPU finishes its arithmetic
              and idles, waiting on HBM. More FLOPs won't help — only moving fewer bytes will
              (fusion, bigger tiles, lower precision).
            </>
          ) : (
            <>
              <strong className="text-ink">Compute-bound.</strong> The multipliers are saturated —
              this op earns the GPU its price tag. Big matmuls live here; almost nothing else does.
            </>
          )}{' '}
          MFU (model-FLOPs-utilization) is this same ratio measured for a whole training run — real
          runs land at 30–50% because attention, norms, and everything that isn't a big matmul drags
          the average down.
        </p>
      </div>
    </div>
  )
}
