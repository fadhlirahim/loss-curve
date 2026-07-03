import { type ReactNode, useState } from 'react'
import { fmt2 } from '@/components/attention/model'
import {
  BANDS,
  dotAtOffset,
  K0,
  Q0,
  ROPE_MAX_POS,
  ropeDot,
  ropeK,
  ropeQ,
  rotate,
  THETA,
} from '@/components/positions/model'
import { cn } from '@/lib/utils'

const SIZE = 280
const C = SIZE / 2
const R = 105

const px = (v: readonly [number, number]) => C + R * v[0]
const py = (v: readonly [number, number]) => C - R * v[1]

function Arrow({
  vec,
  color,
  dashed = false,
  label,
}: {
  vec: readonly [number, number]
  color: string
  dashed?: boolean
  label?: string
}) {
  const tipX = px(vec)
  const tipY = py(vec)
  // arrowhead: two short strokes angled back from the tip
  const angle = Math.atan2(-(tipY - C), tipX - C)
  const headLen = 9
  const head = (da: number) =>
    `${tipX - headLen * Math.cos(angle + da)},${tipY + headLen * Math.sin(angle + da)}`
  return (
    <g>
      <line
        x1={C}
        y1={C}
        x2={tipX}
        y2={tipY}
        stroke={color}
        strokeWidth={dashed ? 1.25 : 2}
        strokeDasharray={dashed ? '4 4' : undefined}
      />
      {!dashed && (
        <polyline
          points={`${head(0.42)} ${tipX},${tipY} ${head(-0.42)}`}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      {label && (
        <text
          x={C + (R + 16) * vec[0] * (1 / Math.hypot(vec[0], vec[1]))}
          y={C - (R + 16) * vec[1] * (1 / Math.hypot(vec[0], vec[1]))}
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="var(--font-mono)"
          fontSize="11"
          fill={color}
        >
          {label}
        </text>
      )}
    </g>
  )
}

function Circle({ children }: { children: ReactNode }) {
  return (
    <>
      <line x1={0} x2={SIZE} y1={C} y2={C} stroke="var(--color-paper-edge)" strokeDasharray="2 5" />
      <line x1={C} x2={C} y1={0} y2={SIZE} stroke="var(--color-paper-edge)" strokeDasharray="2 5" />
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--color-ink-faint)" strokeWidth="1" />
      {children}
    </>
  )
}

/* ── the offset plot ─────────────────────────────────────────── */

const PW = 460
const PH = 170
const PAD = { top: 16, right: 18, bottom: 30, left: 44 }

const ox = (off: number) =>
  PAD.left + ((off + ROPE_MAX_POS) / (2 * ROPE_MAX_POS)) * (PW - PAD.left - PAD.right)
const oy = (d: number) => PAD.top + ((1 - d) / 2) * (PH - PAD.top - PAD.bottom)

const OFFSET_PATH = Array.from({ length: 161 }, (_, s) => {
  const off = -ROPE_MAX_POS + (s / 160) * 2 * ROPE_MAX_POS
  return `${s === 0 ? 'M' : 'L'}${ox(off).toFixed(1)},${oy(dotAtOffset(off)).toFixed(1)}`
}).join(' ')

function OffsetPlot({ offset }: { offset: number }) {
  return (
    <svg
      viewBox={`0 0 ${PW} ${PH}`}
      className="w-full"
      role="img"
      aria-label={`Dot product against position offset. At offset ${offset} the value is ${fmt2(dotAtOffset(offset))}.`}
    >
      <line
        x1={PAD.left}
        x2={PW - PAD.right}
        y1={oy(0)}
        y2={oy(0)}
        stroke="var(--color-paper-edge)"
      />
      <line
        x1={ox(0)}
        x2={ox(0)}
        y1={PAD.top}
        y2={PH - PAD.bottom}
        stroke="var(--color-paper-edge)"
        strokeDasharray="2 5"
      />
      <path d={OFFSET_PATH} fill="none" stroke="var(--color-ink)" strokeWidth="2" />
      <circle cx={ox(offset)} cy={oy(dotAtOffset(offset))} r="5" fill="var(--color-vermillion)" />
      <text
        x={ox(offset)}
        y={oy(dotAtOffset(offset)) - 12}
        textAnchor="middle"
        fontFamily="var(--font-mono)"
        fontSize="10.5"
        fill="var(--color-vermillion)"
      >
        you · {fmt2(dotAtOffset(offset))}
      </text>
      <text
        x={PW - PAD.right}
        y={PH - 8}
        textAnchor="end"
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        OFFSET i − j →
      </text>
      <text
        x={PAD.left - 30}
        y={PAD.top - 2}
        fontFamily="var(--font-mono)"
        fontSize="10"
        letterSpacing="0.08em"
        fill="var(--color-ink-faint)"
      >
        q·k
      </text>
    </svg>
  )
}

/**
 * §3 — RoPE in two dimensions: rotate q by i·θ and k by j·θ, and their
 * dot product depends only on i − j. Lock the offset and slide both to
 * feel the invariance; the plot below is the whole story as a curve.
 */
export function RopeCircle() {
  const [i, setI] = useState(6)
  const [j, setJ] = useState(2)
  const [locked, setLocked] = useState(false)

  const offset = i - j
  const value = ropeDot(i, j)

  function moveI(nextI: number) {
    if (!locked) {
      setI(nextI)
      return
    }
    const nextJ = nextI - offset
    if (nextJ < 0 || nextJ > ROPE_MAX_POS) return
    setI(nextI)
    setJ(nextJ)
  }

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_1fr]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          className="w-full max-w-[320px]"
          role="img"
          aria-label={`Query rotated to position ${i}, key to position ${j}; dot product ${fmt2(value)}`}
        >
          <Circle>
            <Arrow vec={Q0} color="var(--color-ink-faint)" dashed />
            <Arrow vec={K0} color="var(--color-ink-faint)" dashed />
            <Arrow vec={ropeQ(i)} color="var(--color-vermillion)" label={`q·${i}`} />
            <Arrow vec={ropeK(j)} color="var(--color-moss)" label={`k·${j}`} />
          </Circle>
        </svg>

        <div className="flex flex-col justify-center gap-5">
          <label className="block font-mono text-xs">
            <span className="flex justify-between text-ink-soft">
              <span>
                i · <span className="text-vermillion">query</span> position
              </span>
              <span className="text-ink">{i}</span>
            </span>
            <input
              type="range"
              min={0}
              max={ROPE_MAX_POS}
              step={1}
              value={i}
              onChange={(e) => moveI(Number(e.target.value))}
              className="mt-1 w-full accent-vermillion"
            />
          </label>
          <label className={cn('block font-mono text-xs', locked && 'opacity-40')}>
            <span className="flex justify-between text-ink-soft">
              <span>
                j · <span className="text-moss">key</span> position
              </span>
              <span className="text-ink">{j}</span>
            </span>
            <input
              type="range"
              min={0}
              max={ROPE_MAX_POS}
              step={1}
              value={j}
              disabled={locked}
              onChange={(e) => setJ(Number(e.target.value))}
              className="mt-1 w-full accent-moss"
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 font-mono text-ink-soft text-xs">
            <input
              type="checkbox"
              checked={locked}
              onChange={(e) => setLocked(e.target.checked)}
              className="accent-vermillion"
            />
            lock the offset — slide the pair together
          </label>
          <dl className="space-y-2 border border-paper-edge bg-paper-bright p-4 font-mono text-xs">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">rotation per step θ</dt>
              <dd className="text-ink">{fmt2(THETA)} rad</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">offset i − j</dt>
              <dd className="text-ink">{offset}</dd>
            </div>
            <div className="flex justify-between gap-4 border-paper-edge border-t pt-2">
              <dt className="text-ink-soft">q·k after both rotations</dt>
              <dd className={locked ? 'text-moss-deep dark:text-moss' : 'text-vermillion'}>
                {fmt2(value)}
              </dd>
            </div>
          </dl>
          {locked && (
            <p className="font-mono text-[0.7rem] text-moss-deep leading-relaxed dark:text-moss">
              both arrows sweep, the angle between them never changes — q·k is frozen. position
              washed out, distance kept. that's the entire trick.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-paper-edge border-t pt-5">
        <OffsetPlot offset={offset} />
        <p className="mt-1 font-mono text-[0.7rem] text-ink-faint">
          q·k as a function of offset alone — every (i, j) pair with the same i − j lands on the
          same point of this curve.
        </p>
      </div>

      <div className="mt-6 grid gap-5 border-paper-edge border-t pt-5 sm:grid-cols-3">
        {BANDS.map((band) => {
          const qb = rotate(Q0, i * band.theta)
          return (
            <div key={band.label}>
              <svg
                viewBox={`0 0 ${SIZE} ${SIZE}`}
                className="mx-auto w-full max-w-[120px]"
                role="img"
                aria-label={`${band.label} band at position ${i}`}
              >
                <Circle>
                  <Arrow vec={Q0} color="var(--color-ink-faint)" dashed />
                  <Arrow vec={qb} color="var(--color-vermillion)" />
                </Circle>
              </svg>
              <p className="mt-2 text-center font-mono text-[0.68rem] text-ink">{band.label}</p>
              <p className="mt-0.5 text-center font-mono text-[0.62rem] text-ink-faint">
                {band.sense}
              </p>
            </div>
          )
        })}
      </div>
      <p className="mt-3 font-mono text-[0.7rem] text-ink-faint">
        real RoPE rotates many 2-d pairs at once, each with its own θ — clock hands: a second hand
        for local order, an hour hand for long range. drag i above and watch the speeds.
      </p>
    </div>
  )
}
