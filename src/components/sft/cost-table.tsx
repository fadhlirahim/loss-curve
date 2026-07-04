import { Link } from '@tanstack/react-router'
import { CARD_GB, COST_ROWS } from '@/components/sft/model'
import { cn } from '@/lib/utils'

const gb = (n: number) => `${n.toFixed(n < 10 ? 2 : 1)} GB`

const verdict = (n: number) => {
  if (n > CARD_GB) return { text: '✗ OOM', cls: 'text-vermillion' }
  if (n > CARD_GB * 0.6) return { text: '△ tight', cls: 'text-gold' }
  return { text: '✓ fits', cls: 'text-moss' }
}

/**
 * §3 — optimizer-state + base-weight memory for three tuning methods,
 * against a 24 GB consumer card. Activations excluded (assumption stated
 * in the caption); same byte accounting as the GPU-systems lab.
 */
export function CostTable() {
  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] font-mono text-[0.75rem]">
          <thead>
            <tr className="text-left text-[0.62rem] text-ink-faint uppercase tracking-widest">
              <th className="pr-4 pb-2 font-medium">method</th>
              <th className="pr-4 pb-2 font-medium">trained params</th>
              <th className="pr-4 pb-2 font-medium">1B model</th>
              <th className="pr-4 pb-2 font-medium">3B model</th>
              <th className="pb-2 font-medium">what's in memory</th>
            </tr>
          </thead>
          <tbody className="tabular-nums">
            {COST_ROWS.map((row) => {
              const v1 = verdict(row.oneB)
              const v3 = verdict(row.threeB)
              return (
                <tr key={row.method} className="border-paper-edge border-t">
                  <td className="py-2.5 pr-4 text-ink">{row.method}</td>
                  <td className="py-2.5 pr-4 text-ink-soft">{row.trained}</td>
                  <td className="py-2.5 pr-4">
                    {gb(row.oneB)} <span className={cn('ml-1', v1.cls)}>{v1.text}</span>
                  </td>
                  <td className="py-2.5 pr-4">
                    {gb(row.threeB)} <span className={cn('ml-1', v3.cls)}>{v3.text}</span>
                  </td>
                  <td className="py-2.5 text-ink-soft">{row.note}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-3 max-w-2xl text-[0.85rem] text-ink-soft leading-relaxed">
        Verdicts are against a {CARD_GB} GB RTX 4090. Add activations on top (batch- and
        recomputation-dependent — see the{' '}
        <Link to="/learn/gpu-systems" className="link-ink">
          memory anatomy
        </Link>
        ): full fine-tuning a 1B model is <em>borderline</em> on paper and dies in practice once a
        real batch lands; 3B is hopeless either way. LoRA moves the wall by an order of magnitude,
        and QLoRA's 4-bit frozen base is the{' '}
        <Link to="/learn/efficiency" className="link-ink">
          quantization lab
        </Link>{' '}
        applied to fine-tuning.
      </p>
    </div>
  )
}
