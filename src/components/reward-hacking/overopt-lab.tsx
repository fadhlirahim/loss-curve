import { useMemo, useState } from 'react'
import { climb, fmtScore, OPT_STEPS, TRUE_PEAK } from '@/components/reward-hacking/model'
import { useTicker } from '@/hooks/use-ticker'
import { cn } from '@/lib/utils'

function Verdict({ k, collapsed, lambda }: { k: number; collapsed: boolean; lambda: number }) {
  if (k === 0)
    return (
      <>
        Both curves come from the same underlying gains; the proxy also pays a small bonus for
        padding that never stops. Press start and watch what an optimizer does with that.
      </>
    )
  if (collapsed)
    return (
      <>
        The proxy is still climbing — the reward model is <em>thrilled</em> — while true quality is
        now negative. Nothing detects this from inside the training loop; the proxy is the only
        signal the optimizer has.
      </>
    )
  if (lambda >= 0.35)
    return (
      <>
        The leash charges λ·d² for wandering from the reference policy, so the climb stops early —
        close to the true peak, at the cost of some proxy gain. Tune λ too high and you stop before
        the peak: the leash is a tradeoff, not a free fix.
      </>
    )
  return (
    <>
      True quality is rising with the proxy — early optimization is genuinely aligned. The
      divergence comes later, past the peak, when the only thing left to farm is the
      misspecification.
    </>
  )
}

const W = 560
const H = 240
const PAD = { l: 40, r: 12, t: 12, b: 26 }
const Y_MIN = -0.8
const Y_MAX = 3.4

/**
 * §2 — hill-climb the proxy reward and watch true quality rise, peak, and
 * collapse; the KL leash λ decides where the climb stops.
 */
export function OveroptLab() {
  const [lambda, setLambda] = useState(0)
  const [k, setK] = useState(0)
  const [running, setRunning] = useState(false)

  const traj = useMemo(() => climb(lambda), [lambda])
  const done = k >= OPT_STEPS
  useTicker(running && !done, () => setK((v) => Math.min(OPT_STEPS, v + 2)), 40)

  const px = (step: number) => PAD.l + (step / OPT_STEPS) * (W - PAD.l - PAD.r)
  const py = (v: number) => {
    const c = Math.max(Y_MIN, Math.min(Y_MAX, v))
    return PAD.t + (1 - (c - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.t - PAD.b)
  }
  const path = (get: (t: { proxy: number; truth: number }) => number) =>
    traj
      .slice(0, k + 1)
      .map((t, i) => `${i === 0 ? 'M' : 'L'}${px(i).toFixed(1)},${py(get(t)).toFixed(1)}`)
      .join('')

  const now = traj[k]
  const collapsed = now.truth < 0

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[28rem]"
          role="img"
          aria-label="proxy reward and true quality over optimization steps"
        >
          {[0, 1, 2, 3].map((v) => (
            <g key={v}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={py(v)}
                y2={py(v)}
                className="stroke-paper-edge"
                strokeWidth="1"
              />
              <text
                x={PAD.l - 6}
                y={py(v) + 3}
                textAnchor="end"
                className="fill-ink-faint font-mono text-[9px]"
              >
                {v}
              </text>
            </g>
          ))}
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={py(0)}
            y2={py(0)}
            className="stroke-ink-faint"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          <line
            x1={PAD.l}
            x2={W - PAD.r}
            y1={py(TRUE_PEAK)}
            y2={py(TRUE_PEAK)}
            className="stroke-moss"
            strokeWidth="1"
            strokeDasharray="4 3"
            opacity="0.6"
          />
          <text
            x={W - PAD.r}
            y={py(TRUE_PEAK) - 4}
            textAnchor="end"
            className="fill-moss font-mono text-[9px]"
          >
            best reachable true quality
          </text>
          <path
            d={path((t) => t.proxy)}
            fill="none"
            className="stroke-vermillion"
            strokeWidth="2"
          />
          <path d={path((t) => t.truth)} fill="none" className="stroke-moss" strokeWidth="2" />
          {k > 0 && (
            <>
              <circle cx={px(k)} cy={py(now.proxy)} r="3.5" className="fill-vermillion" />
              <circle cx={px(k)} cy={py(now.truth)} r="3.5" className="fill-moss" />
            </>
          )}
          <text x={PAD.l} y={H - 8} className="fill-ink-faint font-mono text-[9px]">
            optimization steps against the proxy →
          </text>
        </svg>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-paper-edge border-t pt-4">
        <button
          type="button"
          onClick={() => {
            if (done) {
              setK(0)
              setRunning(true)
            } else {
              setRunning(!running)
            }
          }}
          className="bg-ink px-4 py-2 font-mono text-paper text-xs transition-colors hover:bg-vermillion"
        >
          {done ? 'again →' : running ? 'pause' : k === 0 ? 'start optimizing →' : 'resume →'}
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            setK(0)
          }}
          disabled={k === 0}
          className="border border-paper-edge px-4 py-2 font-mono text-ink-soft text-xs transition-colors hover:border-ink disabled:opacity-40"
        >
          reset
        </button>
        <label className="ml-auto block w-48 font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>KL leash λ</span>
            <span className="text-ink">{lambda.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0}
            max={1.2}
            step={0.05}
            value={lambda}
            onChange={(e) => setLambda(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-x-8 gap-y-1 border-paper-edge border-t pt-4 font-mono text-xs sm:grid-cols-2">
        <p className="flex justify-between">
          <span className="text-vermillion">proxy reward (what the RM reports)</span>
          <span className="text-ink tabular-nums">{fmtScore(now.proxy)}</span>
        </p>
        <p className="flex justify-between">
          <span className="text-moss">true quality (what you wanted)</span>
          <span className={cn('tabular-nums', collapsed ? 'text-vermillion' : 'text-ink')}>
            {fmtScore(now.truth)}
          </span>
        </p>
      </div>

      <div
        className={cn(
          'mt-4 border-l-2 px-4 py-3',
          collapsed ? 'border-vermillion bg-paper-bright' : 'border-paper-edge',
        )}
      >
        <p className="max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          <Verdict k={k} collapsed={collapsed} lambda={lambda} />
        </p>
      </div>
    </div>
  )
}
