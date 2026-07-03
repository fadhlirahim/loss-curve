import { HEADS, heat, pct, TOKENS } from '@/components/attention/model'

const HATCH =
  'repeating-linear-gradient(45deg, var(--color-paper-deep) 0 2px, var(--color-paper) 2px 4px)'

/**
 * §5 — three mini attention patterns, caricatures of head types actually
 * found in trained GPT-2: content lookup, previous-token, syntax tracking.
 */
export function HeadGrid() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {HEADS.map((head) => (
        <div key={head.name} className="border border-paper-edge bg-paper-deep/30 p-4">
          <h4 className="font-mono text-[0.66rem] text-vermillion uppercase tracking-widest">
            {head.name}
          </h4>
          <div className="mt-3 grid grid-cols-9 gap-px">
            {head.weights.flatMap((row, i) =>
              row.map((w, j) => (
                <span
                  key={`${head.name}-${
                    // biome-ignore lint/suspicious/noArrayIndexKey: static matrix; position is the identity
                    i * TOKENS.length + j
                  }`}
                  title={j > i ? undefined : `${TOKENS[i]} → ${TOKENS[j]} · ${pct(w)}`}
                  className="block aspect-square"
                  style={{ background: j > i ? HATCH : heat(w) }}
                />
              )),
            )}
          </div>
          <p className="mt-3 text-[0.83rem] text-ink-soft leading-relaxed">{head.desc}</p>
        </div>
      ))}
    </div>
  )
}
