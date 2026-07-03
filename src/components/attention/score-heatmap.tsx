import { Fragment, useState } from 'react'
import {
  ATTN_CAUSAL,
  ATTN_FULL,
  D_K,
  DIMS,
  fmt2,
  K,
  pct,
  Q,
  RAW,
  RAW_MAX,
  SCALED,
  TOKENS,
} from '@/components/attention/model'
import { cn } from '@/lib/utils'

const STAGES = [
  {
    tab: '1 · scores',
    desc: 'Raw agreement: every query dotted with every key. Big number = "you have what I\'m looking for." Note the hot cell at row it × col bird.',
  },
  {
    tab: '2 · ÷ √d',
    desc: 'Same matrix ÷ √d (= 2 here). In real models d is 64–128; unscaled scores grow with dimension and slam softmax into saturation, killing gradients. Watch everything fade proportionally.',
  },
  {
    tab: '3 · mask',
    desc: 'A decoder predicts the next word, so a word may not read its own future — every cell above the diagonal is set to −∞ (hatched). Untick the box to preview a bidirectional (BERT-style) encoder.',
  },
  {
    tab: '4 · softmax',
    desc: 'Each row squashed into a probability budget that sums to 100%. This row is what "attention pattern" means — and it\'s what the sentence demo in §1 has been showing you all along.',
  },
]

const heat = (w: number) =>
  `color-mix(in oklab, var(--color-vermillion-deep) ${Math.round(w * 100)}%, var(--color-paper-bright))`

const HATCH =
  'repeating-linear-gradient(45deg, var(--color-paper-deep) 0 3px, var(--color-paper) 3px 6px)'

type Cell = { i: number; j: number }

/**
 * §3 — the 9×9 score matrix, walked through the pipeline stage by stage:
 * raw QKᵀ → ÷√d → causal mask → softmax. Hovering a cell shows the full
 * per-dimension arithmetic in the ticker below.
 */
export function ScoreHeatmap() {
  const [stage, setStage] = useState(0)
  const [mask, setMask] = useState(true)
  const [hover, setHover] = useState<Cell | null>(null)

  const attn = mask ? ATTN_CAUSAL : ATTN_FULL

  const cellView = (i: number, j: number): { w: number; label: string; masked: boolean } => {
    if (stage >= 2 && mask && j > i) return { w: 0, label: '−∞', masked: true }
    switch (stage) {
      case 0:
        return { w: RAW[i][j] / RAW_MAX, label: '', masked: false }
      case 1:
      case 2:
        return { w: SCALED[i][j] / RAW_MAX, label: '', masked: false }
      default: {
        const p = attn[i][j]
        return { w: p, label: p >= 0.15 ? pct(p) : '', masked: false }
      }
    }
  }

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      {/* stage tabs + mask toggle */}
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map((s, idx) => (
          <button
            key={s.tab}
            type="button"
            onClick={() => setStage(idx)}
            className={cn(
              'border px-3 py-2 font-mono text-xs transition-colors',
              idx === stage
                ? 'border-ink bg-ink text-paper'
                : 'border-paper-edge text-ink-soft hover:border-ink',
            )}
          >
            {s.tab}
          </button>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2 font-mono text-ink-soft text-xs">
          <input
            type="checkbox"
            checked={mask}
            onChange={(e) => setMask(e.target.checked)}
            className="accent-vermillion"
          />
          causal mask
        </label>
      </div>
      <p className="mt-3 min-h-[2.6em] max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
        {STAGES[stage].desc}
      </p>

      {/* the matrix */}
      <div className="mt-4 overflow-x-auto pb-1">
        <div className="grid w-max grid-cols-[4.6rem_repeat(9,minmax(2.15rem,2.6rem))] gap-[2px]">
          <div />
          {TOKENS.map((t, j) => (
            <div
              key={`col-${t}-${
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens repeat; position is the identity
                j
              }`}
              className="flex items-center justify-center pb-1 font-mono text-[0.58rem] text-ink-faint"
            >
              {t}
            </div>
          ))}
          {TOKENS.map((rowToken, i) => (
            <Fragment
              key={`row-${rowToken}-${
                // biome-ignore lint/suspicious/noArrayIndexKey: tokens repeat; position is the identity
                i
              }`}
            >
              <div className="flex items-center justify-end pr-2 font-mono text-[0.58rem] text-ink-faint">
                {rowToken}
              </div>
              {TOKENS.map((colToken, j) => {
                const { w, label, masked } = cellView(i, j)
                return (
                  <button
                    key={`cell-${rowToken}-${colToken}-${
                      // biome-ignore lint/suspicious/noArrayIndexKey: static matrix; position is the identity
                      i * TOKENS.length + j
                    }`}
                    type="button"
                    aria-label={`query ${TOKENS[i]} · key ${TOKENS[j]}`}
                    onMouseEnter={() => setHover({ i, j })}
                    onFocus={() => setHover({ i, j })}
                    className={cn(
                      'flex aspect-square items-center justify-center font-mono text-[0.55rem]',
                      'outline-offset-1 hover:z-10 hover:outline hover:outline-2 hover:outline-ink',
                      'focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ink',
                      w > 0.55 ? 'text-paper-bright' : 'text-ink-faint',
                    )}
                    style={{ background: masked ? HATCH : heat(w) }}
                  >
                    {label}
                  </button>
                )
              })}
            </Fragment>
          ))}
        </div>
      </div>
      <div className="mt-3 flex max-w-[26rem] justify-between font-mono text-[0.62rem] text-ink-faint">
        <span>rows ↓ the word asking (query)</span>
        <span>columns → the words answering (keys)</span>
      </div>

      {/* the arithmetic ticker */}
      <div
        className={cn(
          'mt-4 min-h-[5.4rem] border-l-2 px-4 py-3',
          hover ? 'border-vermillion bg-paper-bright' : 'border-paper-edge',
        )}
      >
        {hover ? (
          <Ticker i={hover.i} j={hover.j} mask={mask} attn={attn} />
        ) : (
          <p className="font-mono text-ink-faint text-xs">
            hover any cell — each one is a single query·key dot product.
          </p>
        )}
      </div>
    </div>
  )
}

function Ticker({ i, j, mask, attn }: { i: number; j: number; mask: boolean; attn: number[][] }) {
  const masked = mask && j > i
  return (
    <>
      <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
        q({TOKENS[i]}) · k({TOKENS[j]})
      </p>
      <p className="mt-2 overflow-x-auto font-mono text-[0.8rem] text-ink leading-loose">
        {DIMS.map((dim, d) => (
          <span key={dim}>
            {d > 0 && ' + '}
            <span className={Q[i][d] * K[j][d] > 0.5 ? 'font-semibold text-vermillion' : undefined}>
              {fmt2(Q[i][d])}×{fmt2(K[j][d])}
            </span>
            <sub className="text-ink-faint">{dim}</sub>
          </span>
        ))}
        {' = '}
        <strong>{fmt2(RAW[i][j])}</strong>
        <span className="text-ink-faint"> → ÷√{D_K} → </span>
        <strong>{fmt2(SCALED[i][j])}</strong>
      </p>
      <p className="mt-1.5 max-w-2xl text-[0.88rem] text-ink-soft leading-relaxed">
        {masked ? (
          <>
            …but <strong className="text-ink">"{TOKENS[j]}"</strong> is in{' '}
            <strong className="text-ink">"{TOKENS[i]}"</strong>'s future — the causal mask sets this
            to −∞, so softmax hands it exactly 0.
          </>
        ) : (
          <>
            softmax across the row → <strong className="text-ink">"{TOKENS[i]}"</strong> spends{' '}
            <strong className="text-vermillion">{pct(attn[i][j])}</strong> of its attention on{' '}
            <strong className="text-ink">"{TOKENS[j]}"</strong>.
          </>
        )}
      </p>
    </>
  )
}
