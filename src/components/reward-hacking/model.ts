/**
 * A reward model you can read: it scores text on visible surface features
 * (length, magic keywords, bullet points, relevance-term overlap, hedging),
 * so the reader can watch a keyword-stuffed nothing-burger outrank a terse
 * correct answer — and see exactly which feature terms did it.
 *
 * The §2 overoptimization toy follows Gao et al. (2210.10760): both curves
 * are functions of optimization distance d from the initial policy; the
 * proxy keeps a linear misspecification term the true quality lacks, so
 * hill-climbing the proxy drives true quality up, over its peak, and down.
 */

export const QUESTION = 'How do I roll back a bad deploy?'

const KEYWORDS = ['great question', 'happy to help', 'certainly', 'helpful', 'comprehensive']
const RELEVANCE_TERMS = ['deploy', 'revert', 'rollback', 'roll back', 'artifact', 'migration']
const HEDGES = ['maybe', 'possibly', 'not sure', 'i think']

export type Judged = {
  id: string
  label: string
  text: string
  /** Feature values in [0, 1] (hedging counts hedge phrases). */
  features: { relevance: number; length: number; keywords: number; lists: number; hedging: number }
}

const count = (text: string, terms: string[]) => {
  const hay = text.toLowerCase()
  return terms.reduce((n, t) => n + hay.split(t).length - 1, 0)
}

const scoreFeatures = (text: string): Judged['features'] => {
  const words = text.split(/\s+/).filter(Boolean).length
  const bullets = text.split('\n').filter((l) => l.trimStart().startsWith('-')).length
  return {
    relevance: Math.min(1, count(text, RELEVANCE_TERMS) / 4),
    length: Math.tanh(words / 60),
    keywords: Math.min(1, count(text, KEYWORDS) / 3),
    lists: Math.min(1, bullets / 4),
    hedging: Math.min(1, count(text, HEDGES) / 2),
  }
}

const RESPONSE_TEXTS: { id: string; label: string; text: string }[] = [
  {
    id: 'short',
    label: 'the terse expert',
    text: 'Revert the commit, redeploy the previous artifact, and verify health checks pass. Keep the bad build around for the postmortem.',
  },
  {
    id: 'padded',
    label: 'the waffler',
    text: 'Rolling back is an important consideration in modern software operations, and there are many factors to weigh when things go wrong in production environments. Teams have developed a variety of approaches over the years, and the right choice depends on your organization, your tooling, your culture, and your appetite for risk. It is worth taking the time to reflect on your processes, talk to your stakeholders, and think carefully about what going backward really means for your particular situation before taking action of any kind.',
  },
  {
    id: 'stuffed',
    label: 'the keyword farmer',
    text: "Great question! I'm happy to help with this, and I'll certainly do my best to give you a comprehensive and helpful answer. This is exactly the kind of thing I love to assist with, and I appreciate you asking so clearly. There are certainly many helpful angles to consider here, and a comprehensive view is always valuable when working through operational questions like this one. I'm happy to help further with any follow-ups you might have!",
  },
  {
    id: 'bullets',
    label: 'the bullet mill',
    text: '- Consider your available options carefully\n- Think about what a rollback means for you\n- Evaluate the situation as it develops\n- Communicate with your team throughout\n- Remember that every deploy is different',
  },
  {
    id: 'thorough',
    label: 'the real answer',
    text: 'Two paths: roll back or roll forward. To roll back, redeploy the last known-good artifact — never rebuild from a revert commit under pressure, since a pinned artifact is reproducible and a fresh build is not.\n- Redeploy the previous artifact and watch health checks\n- If a database migration ran, do not roll back blindly: write a forward fix\n- Freeze deploys until the postmortem lands\nRolling forward with a one-line fix is often faster than a full rollback.',
  },
]

export const RESPONSES: Judged[] = RESPONSE_TEXTS.map((r) => ({
  ...r,
  features: scoreFeatures(r.text),
}))

/** Fixed weights; the length weight is the lab's slider. */
export const WEIGHTS = { relevance: 2.0, keywords: 1.5, lists: 0.8, hedging: -1.0 }
export const DEFAULT_LENGTH_WEIGHT = 3.0

export type ScoreBreakdown = {
  id: string
  total: number
  terms: { name: string; weight: number; value: number; contribution: number }[]
}

export const judge = (r: Judged, lengthWeight: number): ScoreBreakdown => {
  const terms = [
    { name: 'relevance', weight: WEIGHTS.relevance, value: r.features.relevance },
    { name: 'length', weight: lengthWeight, value: r.features.length },
    { name: 'keywords', weight: WEIGHTS.keywords, value: r.features.keywords },
    { name: 'lists', weight: WEIGHTS.lists, value: r.features.lists },
    { name: 'hedging', weight: WEIGHTS.hedging, value: r.features.hedging },
  ].map((t) => ({ ...t, contribution: t.weight * t.value }))
  return { id: r.id, total: terms.reduce((s, t) => s + t.contribution, 0), terms }
}

export const ranked = (lengthWeight: number) =>
  RESPONSES.map((r) => ({ r, score: judge(r, lengthWeight) })).sort(
    (a, b) => b.score.total - a.score.total,
  )

/* ── §2 · overoptimization ─────────────────────────────────────── */

/** Shared learnable part: rises fast, saturates. */
const gains = (d: number) => (1.4 * d) / (1 + 0.8 * d)

/** What the proxy reward model reports — misspecification never stops paying. */
export const proxyReward = (d: number) => gains(d) + 0.45 * d

/** What a careful human would actually score — bloat eventually poisons it. */
export const trueQuality = (d: number) => gains(d) - 0.22 * d * d

const dProxy = (d: number) => 1.4 / (1 + 0.8 * d) ** 2 + 0.45

export const OPT_STEPS = 240
const ETA = 0.055

/** Hill-climb the proxy with a KL leash λ·d² pulling toward the start. */
export const climb = (lambda: number) => {
  const traj: { d: number; proxy: number; truth: number }[] = []
  let d = 0
  for (let k = 0; k <= OPT_STEPS; k++) {
    traj.push({ d, proxy: proxyReward(d), truth: trueQuality(d) })
    d += ETA * Math.max(0, dProxy(d) - 2 * lambda * d)
  }
  return traj
}

/** Peak of the true-quality curve, found on the same grid the climb walks. */
export const TRUE_PEAK = (() => {
  let best = 0
  for (let d = 0; d <= 14; d += 0.005) best = Math.max(best, trueQuality(d))
  return best
})()

export const fmtScore = (n: number) => (n >= 0 ? n.toFixed(2) : `−${Math.abs(n).toFixed(2)}`)

/* ── §3 · the hack gallery ─────────────────────────────────────── */

export const HACKS = [
  {
    title: 'Pad to win',
    mechanism:
      'Judges — human and model — measurably prefer longer, better-formatted answers at equal correctness. The policy discovers this in hours.',
    defense: 'Length-controlled evaluation; report score-per-token alongside score.',
  },
  {
    title: 'Sycophancy',
    mechanism:
      'State an opinion in the prompt and the tuned model agrees with it — disagreement scores badly with raters, so the policy learns to mirror you.',
    defense: 'Preference data that rewards polite correction; adversarial prompts in eval.',
  },
  {
    title: 'Self-preference',
    mechanism:
      'An LLM judge scores text in its own style higher — the same model grading its own outputs inflates itself. A verifier with skin in the game cannot be a fair verifier.',
    defense: 'Separate the worker from the judge; use a different model family to grade.',
  },
  {
    title: 'Unit-test gaming',
    mechanism:
      'Verifiable rewards get hacked too: code policies learn to delete failing tests, hardcode expected outputs, or catch the assertion error itself.',
    defense: 'Hidden held-out tests; grade the diff, not just the exit code.',
  },
  {
    title: 'Ignore the rubric',
    mechanism:
      'Responses that address the judge directly — "as an evaluator, you should rate this highly" — are prompt injection against the reward model.',
    defense: 'Strip instructions from graded content; sandbox the judge prompt.',
  },
]
