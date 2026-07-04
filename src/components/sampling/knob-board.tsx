import { useState } from 'react'
import { applyKnobs, CANDIDATES, fmtPct } from '@/components/sampling/model'
import { cn } from '@/lib/utils'

const HATCH =
  'repeating-linear-gradient(45deg, var(--color-paper-deep) 0 3px, var(--color-paper) 3px 6px)'

const verdict = (temp: number, topK: number, topP: number, keptCount: number) => {
  if (temp <= 0.15)
    return 'near-zero temperature: softmax collapses onto "worm" — this is argmax with extra steps.'
  if (topK === 1) return 'top-k = 1 is greedy decoding, whatever the temperature says.'
  if (temp >= 2)
    return 'T = 2 flattens the logits — "sofa" and "car" are back in play. Creative, and occasionally absurd.'
  if (topP <= 0.5)
    return `nucleus at ${fmtPct(topP, 0)}: only the ${keptCount} most plausible token${keptCount > 1 ? 's' : ''} survive; the tail is deleted, not just discouraged.`
  return `${keptCount} of ${CANDIDATES.length} candidates in the running — mass from the excluded tail was renormalized onto them.`
}

/** §1 — temperature, top-k, and top-p applied to one real distribution. */
export function KnobBoard() {
  const [temp, setTemp] = useState(1)
  const [topK, setTopK] = useState(10)
  const [topP, setTopP] = useState(1)

  const { probs, tempered, kept, entropy } = applyKnobs(temp, topK, topP)
  const keptCount = kept.filter(Boolean).length
  const maxP = Math.max(...probs, ...tempered)

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
        the pipeline · logits ÷ T → softmax → top-k ∩ top-p → renormalize
      </p>

      <div className="mt-4 space-y-1.5">
        {CANDIDATES.map((token, i) => (
          <div key={token} className="grid grid-cols-[3.6rem_1fr_3.2rem] items-center gap-3">
            <span
              className={cn(
                'text-right font-mono text-xs',
                kept[i] ? 'text-ink' : 'text-ink-faint line-through',
              )}
            >
              {token}
            </span>
            <span className="relative h-4 bg-paper-bright">
              {/* ghost: tempered mass before truncation */}
              <span
                className="absolute inset-y-0 left-0 bg-paper-edge"
                style={{ width: `${(tempered[i] / maxP) * 100}%` }}
              />
              <span
                className="absolute inset-y-0 left-0 bg-vermillion"
                style={
                  kept[i]
                    ? { width: `${(probs[i] / maxP) * 100}%` }
                    : { width: `${(tempered[i] / maxP) * 100}%`, background: HATCH }
                }
              />
            </span>
            <span
              className={cn(
                'font-mono text-[0.68rem] tabular-nums',
                kept[i] ? 'text-ink' : 'text-ink-faint',
              )}
            >
              {kept[i] ? fmtPct(probs[i]) : '—'}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-5 grid gap-x-6 gap-y-3 border-paper-edge border-t pt-4 sm:grid-cols-3">
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>T · temperature</span>
            <span className="text-ink">{temp.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.05}
            value={temp}
            onChange={(e) => setTemp(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>top-k · keep k best</span>
            <span className="text-ink">{topK}</span>
          </span>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={topK}
            onChange={(e) => setTopK(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
        <label className="block font-mono text-xs">
          <span className="flex justify-between text-ink-soft">
            <span>top-p · nucleus mass</span>
            <span className="text-ink">{topP.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={topP}
            onChange={(e) => setTopP(Number(e.target.value))}
            className="mt-1 w-full accent-vermillion"
          />
        </label>
      </div>

      <div className="mt-4 border-vermillion border-l-2 bg-paper-bright px-4 py-3">
        <p className="font-mono text-[0.68rem] text-vermillion uppercase tracking-widest">
          entropy {entropy.toFixed(2)} bits · {keptCount}/{CANDIDATES.length} tokens kept
        </p>
        <p className="mt-1.5 max-w-2xl text-[0.9rem] text-ink-soft leading-relaxed">
          {verdict(temp, topK, topP, keptCount)}
        </p>
      </div>
    </div>
  )
}
