import { createFileRoute, Link } from '@tanstack/react-router'
import { BulletList } from '@/components/bullet-list'
import { Section } from '@/components/section'

export const Route = createFileRoute('/rl')({
  head: () => ({ meta: [{ title: 'The RL branch · Roadmap to Mastery' }] }),
  component: RlPage,
})

const RL_PHASES = [
  {
    id: 'RL-0',
    title: 'Orientation',
    weeks: '≈ days',
    goal: 'Train one working RL agent end-to-end before you understand it, and pick your lane.',
    points: [
      'Do Hugging Face Deep RL Course, Unit 1 — train an agent on a Gymnasium env with Stable-Baselines3 in an afternoon. Watch a reward curve go up.',
      'Decide your lane (classic deep RL vs RL-for-LLMs) — write it in your LOG.md. For tractability solo, default to the RLVR lane.',
    ],
    artifact: 'A trained agent + a reward curve in your repo.',
    trap: "Starting with Sutton & Barto chapter 1. Don't. Train something first.",
  },
  {
    id: 'RL-1',
    title: 'RL foundations',
    weeks: '≈ 4–6 wk',
    goal: 'Understand and implement the core RL machinery from a blank file. The "micrograd of RL."',
    points: [
      'Learn: MDPs, return + discounting, value functions (V, Q), the Bellman equations, dynamic programming, exploration vs exploitation, and tabular methods — Q-learning, SARSA, TD learning.',
      "Primary path: Sutton & Barto Part I (tabular) — read alongside coding, not before. Supplement with David Silver's RL lectures.",
    ],
    artifact:
      'Tabular Q-learning and SARSA from a blank file on a gridworld / FrozenLake / Taxi — no library doing the learning for you. Plot the value function; show the policy converging.',
    trap: 'Jumping to deep RL before tabular intuition. The deep stuff is function approximation bolted onto these ideas — skip them and nothing later makes sense.',
  },
  {
    id: 'RL-2',
    title: 'Deep RL',
    weeks: '≈ 8–12 wk',
    goal: 'The modern algorithms, and a clean reproduction + ablation — your L2 credential on the RL side.',
    points: [
      'Learn: function approximation, DQN (replay buffers, target nets), policy gradients (REINFORCE), actor-critic (A2C), and PPO — the workhorse you must know cold. GAE, advantage normalization, the bias-variance levers.',
      'Primary path: OpenAI Spinning Up + CleanRL (single-file, research-grade implementations — the "nanoGPT of RL") + Gymnasium + Stable-Baselines3 for trusted baselines.',
    ],
    artifact:
      'Reproduce PPO on classic control with CleanRL (CartPole → LunarLander), then ONE clean ablation (e.g. GAE on/off, clip range) with ≥3 seeds and reported variance.',
    trap: 'Reproducibility hell — RL variance is brutal; one seed is a lie. Seed everything, report spread. And env steps dominate: budget wall-clock time, not just GPU-dollars.',
  },
  {
    id: 'RL-3',
    title: 'The LLM intersection — RLHF / GRPO / RLVR',
    weeks: '≈ 4–8 wk',
    goal: 'The cheap-compute, high-energy lane — where this branch rejoins the LLM track. This IS Phase 4.',
    points: [
      'Learn: reward modeling (+ reward hacking), PPO-for-LLMs (RLHF), DPO, GRPO (critic-free, group-normalized advantages), and RLVR (verifiable rewards: math/code where correctness is auto-checkable).',
      "Primary path: The RLHF Book + HF TRL + CS336's RL assignment + the open frameworks (Open-Reasoner-Zero, DAPO).",
    ],
    artifact:
      'A small GRPO/RLVR run on a 0.5–1.5B model with a programmatic/verifiable reward + an honest eval with a same-size baseline.',
    trap: "GRPO is finicky (KL control, reward hacking, wall-clock ≫ GPU-hours) — SFT+DPO is the safer first step. And don't overclaim RLVR gains: some 2026 work argues it makes models faster at what they already can do, not fundamentally smarter.",
  },
  {
    id: 'RL-4',
    title: 'Specialization & research',
    weeks: 'ongoing',
    goal: 'Pick a lane and ship an original result. Same research method, same L3 bar.',
    points: [
      'Lanes (depth over breadth): RL-for-reasoning/RLVR (most tractable solo) · small-scale classic deep RL · model-based / offline / exploration / multi-agent RL.',
      "Reproduction-as-contribution: given RL's reproducibility crisis, a careful, seeded reproduction of a published RL result is a genuinely valued contribution (ICLR Blog Posts, MLRC).",
    ],
    artifact: 'A public, reproducible original result others can use.',
    trap: "Choosing classic deep RL because it looks like a shortcut. Choose it because you can't stop thinking about the control problem.",
  },
]

const RL_RESOURCES = [
  ['Hugging Face Deep RL Course', 'RL-0', 'Hands-on on-ramp (SB3 + Gymnasium). Start here.'],
  [
    'Sutton & Barto — Reinforcement Learning: An Introduction',
    'RL-1',
    'The bible. Part I (tabular) first; read alongside code. Free PDF.',
  ],
  ['David Silver — RL Course', 'RL-1', 'The canonical lecture series (DeepMind/UCL).'],
  ['OpenAI Spinning Up', 'RL-2', 'Best practical deep-RL intro.'],
  ['CleanRL', 'RL-2', 'Single-file deep-RL implementations (PPO/DQN/SAC). Reproduce these.'],
  ['Gymnasium (Farama)', 'RL-0–2', 'Standard env interface, successor to OpenAI Gym.'],
  ['The RLHF Book + HF TRL', 'RL-3', 'The RL/LLM intersection (RLHF/DPO/GRPO/RLVR).'],
  ['RL Field Manual (rl.paraz.in)', 'RL-3', 'Interactive guide to LLM RL; #frontier covers RLVR.'],
  ['DeepSeek-R1', 'RL-3', 'The RLVR/GRPO reasoning result that defined the frontier.'],
] as const

function RlPage() {
  return (
    <main>
      <div className="mx-auto w-full max-w-4xl px-6 pt-16 pb-4 sm:px-10">
        <p className="rise overline">A sibling branch · same trunk</p>
        <h1 className="rise rise-1 mt-3 font-display font-medium text-4xl tracking-tight sm:text-5xl">
          The RL branch
        </h1>
        <p className="prose-note rise rise-2 mt-5 max-w-2xl">
          ML has three classical paradigms — supervised, self-supervised (LLM pretraining), and{' '}
          <strong>reinforcement learning</strong>. RL is one branch, not the root; the root is the
          trunk you already know (backprop, optimization, neural nets). The twist that matters: the
          RL and LLM branches <strong>merge at the frontier</strong> — modern LLM post-training
          (RLHF, GRPO/RLVR) <em>is</em> RL applied to language models.
        </p>
        <div className="rise rise-3 mt-8 grid max-w-2xl gap-4 sm:grid-cols-2">
          <div className="border border-paper-edge bg-paper-deep/30 p-5">
            <h3 className="font-display font-semibold">Classic deep RL</h3>
            <p className="mt-2 text-[0.95rem] text-ink-soft leading-relaxed">
              Games, robotics, control. Harder and less forgiving solo: sample-inefficient,
              compute-hungry, brittle, with a real reproducibility problem. Pick it for love of the
              problem, not tractability.
            </p>
          </div>
          <div className="border border-paper-edge border-vermillion border-l-2 bg-paper-deep/50 p-5">
            <h3 className="font-display font-semibold">
              RL-for-LLMs / RLVR{' '}
              <span className="font-mono text-vermillion text-xs">← steer here</span>
            </h3>
            <p className="mt-2 text-[0.95rem] text-ink-soft leading-relaxed">
              Reasoning models. The hottest area, most jobs, and the most tractable for a solo
              person on one GPU — it reuses your entire LLM-track skillset.
            </p>
          </div>
        </div>
        <blockquote className="rise rise-4 mt-8 max-w-2xl border-vermillion border-l-2 pl-5 font-display text-ink-soft text-lg italic leading-relaxed">
          Even RL veterans call Sutton &amp; Barto a slog. Do not read it cover-to-cover before
          touching code. Ship a working agent early, hit a wall, then pull the theory in. RL
          punishes the "learn everything first" instinct harder than any other branch.
        </blockquote>
      </div>

      <Section label="The phases" title="Same template, different branch">
        <div className="space-y-10">
          {RL_PHASES.map((p) => (
            <article key={p.id} className="border-paper-edge border-t pt-8">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-display font-semibold text-2xl">
                  <span className="mr-3 font-medium font-mono text-sm text-vermillion">{p.id}</span>
                  {p.title}
                </h3>
                <span className="font-mono text-ink-faint text-xs">{p.weeks}</span>
              </div>
              <p className="prose-note mt-3 max-w-2xl">
                <strong>Goal:</strong> {p.goal}
              </p>
              <BulletList
                className="mt-4 space-y-3"
                itemClassName="text-[0.95rem]"
                items={p.points}
              />
              <p className="mt-4 border-paper-edge border-l-2 pl-5 font-mono text-ink-faint text-xs leading-relaxed">
                artifact: {p.artifact}
              </p>
              <p className="prose-note mt-3 max-w-2xl text-[0.95rem]">
                <span className="font-semibold text-vermillion">✗ trap:</span> {p.trap}
              </p>
            </article>
          ))}
        </div>
      </Section>

      <hr className="rule mx-auto max-w-4xl" />

      <Section label="Resources" title="The RL shelf">
        <div className="space-y-0">
          {RL_RESOURCES.map(([name, phase, note]) => (
            <div
              key={name}
              className="grid gap-x-6 gap-y-1 border-paper-edge border-t py-3.5 sm:grid-cols-[1fr_5rem_1.2fr]"
            >
              <span className="font-display font-semibold">{name}</span>
              <span className="font-mono text-vermillion text-xs">{phase}</span>
              <span className="text-[0.95rem] text-ink-soft">{note}</span>
            </div>
          ))}
        </div>
      </Section>

      <div className="mx-auto w-full max-w-4xl px-6 pb-20 sm:px-10">
        <div className="border-vermillion border-l-2 bg-paper-deep/50 px-6 py-5">
          <p className="prose-note max-w-2xl">
            <strong>The honest bottom line:</strong> for tractable, impactful research as a solo
            person on one GPU, take <strong>RL-3 (RLVR/reasoning)</strong> — it's the frontier, it's
            cheap-ish compute, and it reuses everything in your{' '}
            <Link to="/phases/$phaseId" params={{ phaseId: '4' }} className="link-ink">
              LLM track
            </Link>
            . Either way: same trunk, same method, same ship-the-artifact discipline.
          </p>
        </div>
      </div>
    </main>
  )
}
