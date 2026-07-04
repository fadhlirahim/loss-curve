import { useState } from 'react'
import { ATTEMPTS, GRPO_PROBLEM, groupAdvantages } from '@/components/preference-tuning/model'
import { cn } from '@/lib/utils'

/** §3 — GRPO: eight rollouts, a checker, and the group mean as the baseline. */
export function GrpoPanel() {
  const [correct, setCorrect] = useState(ATTEMPTS.map((a) => a.correct))

  const rewards = correct.map((c) => (c ? 1 : 0))
  const { advantages, uniform, mean, std } = groupAdvantages(rewards)
  const nCorrect = correct.filter(Boolean).length

  return (
    <div className="border border-paper-edge bg-paper-deep/40 p-4 sm:p-6">
      <p className="font-mono text-[0.65rem] text-ink-faint uppercase tracking-widest">
        prompt · {GRPO_PROBLEM} — click an attempt to flip what the checker returns
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {ATTEMPTS.map((attempt, i) => {
          const adv = advantages[i]
          return (
            <button
              key={attempt.text}
              type="button"
              onClick={() => setCorrect(correct.map((c, j) => (j === i ? !c : c)))}
              className={cn(
                'border p-3 text-left transition-colors',
                correct[i]
                  ? 'border-moss/60 bg-paper-bright'
                  : 'border-paper-edge bg-paper-bright/60 hover:border-ink',
              )}
            >
              <span className="flex items-baseline justify-between gap-3 font-mono text-[0.65rem]">
                <span className={correct[i] ? 'text-moss' : 'text-vermillion'}>
                  {correct[i] ? '✓ reward 1' : '✗ reward 0'}
                </span>
                <span className="text-ink tabular-nums">
                  A = {uniform ? '0.00' : advantages[i].toFixed(2)}
                </span>
              </span>
              <span className="mt-1.5 block font-mono text-[0.8rem] text-ink-soft">
                {attempt.text}
              </span>
              <span className="relative mt-2 block h-1.5 bg-paper-deep">
                <span
                  className={cn(
                    'absolute inset-y-0',
                    adv >= 0 ? 'left-1/2 bg-moss' : 'right-1/2 bg-vermillion',
                  )}
                  style={{ width: `${Math.min(50, Math.abs(adv) * 33)}%` }}
                />
                <span className="absolute inset-y-0 left-1/2 w-px bg-paper-edge" />
              </span>
            </button>
          )
        })}
      </div>

      <p className="mt-4 font-mono text-ink-soft text-xs">
        {nCorrect}/8 correct · group mean {mean.toFixed(2)} · std {std.toFixed(2)}
      </p>

      <div
        className={cn(
          'mt-4 border-l-2 px-4 py-3',
          uniform ? 'border-gold bg-paper-bright' : 'border-vermillion bg-paper-bright',
        )}
      >
        {uniform ? (
          <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
            <strong className="text-gold">No signal — this prompt teaches nothing.</strong> When
            every attempt gets the same reward, the group mean equals every reward and all
            advantages are zero. Too-easy and too-hard prompts are pure waste — which is exactly why
            GRPO pipelines filter for problems the model gets right <em>sometimes</em>.
          </p>
        ) : (
          <p className="max-w-2xl text-[0.95rem] text-ink-soft leading-relaxed">
            Above-average attempts get pushed up, below-average pushed down — the group mean is the
            baseline, so <strong className="text-ink">no learned critic is needed</strong>. And the
            reward is a <em>checker</em> (did it print 408?), not a learned model: that's RLVR, and
            it's the entire small-reasoning-models frontier — verifiable rewards can't be flattered,
            only gamed.
          </p>
        )}
      </div>
    </div>
  )
}
