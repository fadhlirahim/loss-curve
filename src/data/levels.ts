export type Level = {
  id: string
  name: string
  capability: string
  time: string
  reachedBy: string
}

export const LEVELS: Level[] = [
  {
    id: 'L0',
    name: 'Tourist',
    capability: 'Run notebooks, call APIs, not explain internals.',
    time: '—',
    reachedBy: 'where most people stop',
  },
  {
    id: 'L1',
    name: 'Reproducer',
    capability:
      'Build + train a small model from a blank file; read most papers; reproduce a simple published result.',
    time: '3–6 mo',
    reachedBy: 'Phases 1–2',
  },
  {
    id: 'L2',
    name: 'Extender',
    capability:
      'Take a paper and run a clean, controlled ablation/extension; know the pretrain→post-train→eval stack; ship a reproducible artifact.',
    time: '6–12 mo',
    reachedBy: 'Phases 3–4',
  },
  {
    id: 'L3',
    name: 'Contributor',
    capability:
      'Produce a small original result others use/cite; engaged in a community; a workshop paper or a serious blog-post result.',
    time: '1–2 yr',
    reachedBy: 'Phase 5',
  },
  {
    id: 'L4',
    name: 'Independent researcher',
    capability: 'Set your own research direction; produce recognized original work.',
    time: '2–4+ yr',
    reachedBy: 'beyond this map',
  },
]

export type DiagnosticQuestion = {
  id: string
  text: string
  failPhase: number
}

/** "You are here" — start at the first one you can't confidently do (by implementing). */
export const DIAGNOSTIC: DiagnosticQuestion[] = [
  {
    id: 'd1',
    text: 'Derive backprop for a 2-layer MLP by hand and implement it from a blank file (no autograd).',
    failPhase: 1,
  },
  {
    id: 'd2',
    text: "Implement multi-head self-attention from scratch and explain why it's permutation-equivariant without positional encodings.",
    failPhase: 2,
  },
  {
    id: 'd3',
    text: 'Explain the Chinchilla scaling law, what MFU is, and roughly what it costs to train a 1B model on one GPU.',
    failPhase: 3,
  },
  {
    id: 'd4',
    text: 'Explain the difference between SFT, DPO, and GRPO, and name two ways an eval can lie to you.',
    failPhase: 4,
  },
  {
    id: 'd5',
    text: 'Take a recent small-models paper, identify its baseline + the one confound that would invalidate it, and design a controlled extension.',
    failPhase: 5,
  },
]

export const PRINCIPLES = [
  {
    title: 'Build first, theory just-in-time',
    detail:
      'Do NOT spend 6 months on linear algebra before touching a model. Build a working thing, hit a wall, learn exactly the theory that wall requires, continue. The math matters — you pull it in when a model forces you to, not preemptively.',
  },
  {
    title: "Spiral, don't sequence",
    detail:
      "The phases are a competence map, not a strict order. You'll build a tiny transformer in Phase 2 before you \"finish\" Phase 1's math — that's correct. A vertical slice early beats a perfect horizontal foundation.",
  },
  {
    title: 'Artifacts over courses',
    detail:
      'A finished course is worth nothing; a reproduced result with a writeup is worth a lot. Every phase ends in a shippable artifact. If you "completed" a phase but have nothing to show, you didn\'t complete it.',
  },
  {
    title: 'Reproduce before you innovate',
    detail:
      "You earn the right to have ideas by first reproducing other people's. Reproduction is where 80% of the real learning lives and where taste is built.",
  },
  {
    title: 'Learn in public',
    detail:
      "A private learner is an invisible learner with no feedback loop. Push code to GitHub, write short notes, post them, join a community. It's the feedback mechanism that makes you improve and the network that gets you collaborators and compute.",
  },
]

export const ANTI_PATTERNS = [
  {
    title: 'Math-first paralysis',
    detail:
      "\"I'll learn all the linear algebra first.\" You won't, and you don't need to. Pull math in when a model demands it.",
  },
  {
    title: 'Tutorial hell / course collecting',
    detail:
      "Finishing lectures feels like progress and isn't. If you can't implement it from a blank file, you don't know it. Watched ≠ can-build.",
  },
  {
    title: 'Skipping reproduction',
    detail:
      'Chasing "novel" before you can reproduce. You\'ll generate confident nonsense. Reproduce first.',
  },
  {
    title: 'Learning in private',
    detail:
      'No public repo, no notes, no community. Invisible, and no feedback loop. Fix this in week 1.',
  },
  {
    title: 'Perfecting the plan',
    detail:
      'Re-reading roadmaps, re-sequencing, optimizing your setup. This site included: read it once, start Phase 0 today, deviate freely.',
  },
  {
    title: 'Over-respecting the phases',
    detail:
      'They\'re a spiral, not a gate. Build the tiny transformer before you "finish" the math.',
  },
]
