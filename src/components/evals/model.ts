/**
 * Four ways an eval lies, each computable at toy scale.
 *
 * §1 sampling noise — real binomial simulation + the analytic CI.
 * §2 graders — four real grading functions run against one fixed answer set.
 * §3 contamination — word-3-gram Jaccard scan of a toy pretraining corpus.
 * §4 prompt sensitivity — hand-set per-format accuracies (illustrative of the
 *    measured MMLU format-sensitivity phenomenon; the VALUES are ours, the
 *    ranking flip is the documented behavior).
 */

import { seededRng } from '@/components/neural-net/model'

/* ── §1 · the noise floor ─────────────────────────────────────── */

/** Abramowitz–Stegun 7.1.26 erf approximation (|error| < 1.5e-7). */
const erf = (x: number) => {
  const sign = x < 0 ? -1 : 1
  const ax = Math.abs(x)
  const t = 1 / (1 + 0.3275911 * ax)
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) *
      t *
      Math.exp(-ax * ax)
  return sign * y
}

const phi = (x: number) => 0.5 * (1 + erf(x / Math.SQRT2))

export const ciHalfWidth = (p: number, n: number) => 1.96 * Math.sqrt((p * (1 - p)) / n)

/** 20 simulated eval runs: measured accuracy of a true-ability-p model on n questions. */
export const simulateRuns = (p: number, n: number, runs: number, seed: number) => {
  const rng = seededRng(seed)
  const out: number[] = []
  for (let r = 0; r < runs; r++) {
    let correct = 0
    for (let i = 0; i < n; i++) if (rng() < p) correct++
    out.push(correct / n)
  }
  return out
}

/**
 * P(one eval run ranks B above A) when B's true ability is p+δ,
 * via the normal approximation to the binomial (stated in the UI).
 */
export const pCorrectRanking = (p: number, delta: number, n: number) => {
  const pb = Math.min(0.999, p + delta)
  const sd = Math.sqrt((p * (1 - p)) / n + (pb * (1 - pb)) / n)
  return phi(delta / sd)
}

/* ── §2 · the grader ──────────────────────────────────────────── */

const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/[.,!?"'’:;()—-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const firstNumber = (s: string) => {
  const m = s.replace(/,/g, '').match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

const looksNumeric = (s: string) => /^-?[\d.,\s]+$/.test(s.trim())

export type GraderId = 'exact' | 'normalized' | 'numeric' | 'substring'

export const GRADERS: { id: GraderId; label: string; desc: string }[] = [
  { id: 'exact', label: 'exact match', desc: 'answer === truth, byte for byte' },
  { id: 'normalized', label: 'normalized', desc: 'lowercase, strip punctuation, collapse spaces' },
  {
    id: 'numeric',
    label: 'numeric-tolerant',
    desc: 'parse the first number when truth is a number',
  },
  {
    id: 'substring',
    label: 'contains-answer',
    desc: 'normalized answer contains normalized truth',
  },
]

export const grade = (id: GraderId, truth: string, answer: string): boolean => {
  switch (id) {
    case 'exact':
      return answer === truth
    case 'normalized':
      return normalize(answer) === normalize(truth)
    case 'numeric': {
      if (!looksNumeric(truth)) return normalize(answer) === normalize(truth)
      const t = firstNumber(truth)
      const a = firstNumber(answer)
      return t !== null && a !== null && Math.abs(t - a) <= 1e-9 * Math.max(1, Math.abs(t))
    }
    case 'substring':
      return normalize(answer).includes(normalize(truth))
  }
}

type AnswerItem = {
  q: string
  truth: string
  answer: string
  /** The model's answer is factually wrong — a grader that passes it is lying. */
  modelWrong?: boolean
  note?: string
}

export const ANSWER_SET: AnswerItem[] = [
  { q: 'What is 12 + 15?', truth: '27', answer: '27' },
  { q: 'How many heads did our toy attention layer have?', truth: '7', answer: '7.0' },
  { q: 'Capital of France?', truth: 'Paris', answer: 'paris' },
  { q: 'When was the US Constitution effective?', truth: 'March 4, 1789', answer: 'March 4 1789' },
  {
    q: 'Does the causal mask block future tokens?',
    truth: 'yes',
    answer: 'Yes, because the mask blocks attention to later positions.',
    note: 'correct — but only the lenient grader can see it',
  },
  { q: 'The answer to everything?', truth: '42', answer: 'The answer is 42.' },
  { q: 'Is a bigger eval always better?', truth: 'no', answer: 'no' },
  {
    q: 'Can one seed prove a speedup?',
    truth: 'no',
    answer: 'Not at all certain — most sources say yes.',
    modelWrong: true,
    note: 'the model said YES (wrong) — but "Not" contains "no", so contains-answer credits it',
  },
  {
    q: 'Value of π to 5 decimals?',
    truth: '3.14159',
    answer: 'π ≈ 3.14',
    note: 'wrong at the asked precision — all four graders agree, for once',
  },
  {
    q: 'Spell out the number 7.',
    truth: 'seven',
    answer: '7',
    note: 'correct in spirit — every grader robs it',
  },
]

export const gradeAll = (id: GraderId) => {
  const passes = ANSWER_SET.map((item) => grade(id, item.truth, item.answer))
  const score = passes.filter(Boolean).length / ANSWER_SET.length
  return { passes, score }
}

/* ── §3 · contamination ───────────────────────────────────────── */

type BenchItem = {
  q: string
  /** Whether the toy model answers this item correctly. */
  correct: boolean
}

export const BENCH: BenchItem[] = [
  {
    q: 'How many bytes per parameter does AdamW mixed precision training keep in memory',
    correct: true,
  },
  {
    q: 'What ratio of training tokens to parameters is compute optimal under the Chinchilla scaling law',
    correct: true,
  },
  {
    q: 'Which matrix does FlashAttention avoid materializing during the attention computation',
    correct: true,
  },
  { q: 'What does the causal mask remove from the attention score matrix', correct: true },
  {
    q: 'Why does a decoder language model need positional information in its inputs',
    correct: false,
  },
  { q: 'What quantity does perplexity exponentiate to summarize a language model', correct: true },
  { q: 'What failure appears when a reward model is optimized against too hard', correct: false },
  { q: 'Which decoding parameter trades diversity against repetition in sampling', correct: true },
  {
    q: 'What does gradient accumulation trade away to fit large batches in memory',
    correct: false,
  },
  {
    q: 'Why do duplicated documents in a pretraining corpus damage evaluation trust',
    correct: true,
  },
]

const CORPUS: { id: string; text: string }[] = [
  {
    id: 'quiz-blog',
    text: 'Pop quiz for ML interviews! Q3: How many bytes per parameter does AdamW mixed precision training keep in memory? Answer: sixteen. Q4: What does the causal mask remove from the attention score matrix? Answer: the upper triangle.',
  },
  {
    id: 'forum-answer',
    text: 'people keep asking what ratio of training tokens to parameters is compute optimal under the chinchilla scaling law and the short answer is about twenty tokens per parameter',
  },
  {
    id: 'recipe',
    text: 'Combine the flour and butter, rest the dough for an hour, then bake at 200 degrees until golden brown.',
  },
  {
    id: 'navbar',
    text: 'Home About Products Pricing Careers Contact Sign in Register Terms of service Privacy policy.',
  },
  {
    id: 'news',
    text: 'The city council approved the new transit budget on Tuesday after a lengthy public comment session.',
  },
  {
    id: 'docs',
    text: 'To install the package run the command in your terminal and restart the development server afterwards.',
  },
  {
    id: 'review',
    text: 'The battery lasts two full days and the camera is excellent in daylight but struggles at night.',
  },
  {
    id: 'sports',
    text: 'A late goal in the second half sealed the championship for the visiting side after a tense first leg.',
  },
  {
    id: 'travel',
    text: 'The old town is walkable in an afternoon and the market square is worth visiting early in the morning.',
  },
  {
    id: 'blog',
    text: 'I switched to a standing desk last spring and honestly the difference in afternoon focus is noticeable.',
  },
]

const wordTrigrams = (s: string) => {
  const words = normalize(s).split(' ')
  const grams = new Set<string>()
  for (let i = 0; i + 2 < words.length; i++)
    grams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  return grams
}

/**
 * Containment, not symmetric Jaccard: the fraction of the ITEM's trigrams found
 * in the doc. Corpus docs are much longer than benchmark items, so Jaccard
 * dilutes toward zero — real decontamination pipelines measure containment for
 * exactly this reason.
 */
const containment = (item: Set<string>, doc: Set<string>) => {
  if (item.size === 0) return 0
  let inter = 0
  for (const g of item) if (doc.has(g)) inter++
  return inter / item.size
}

type ContaminationHit = { maxSim: number; source: string }

/** Max word-3-gram containment of each benchmark item against the corpus. */
export const CONTAMINATION: ContaminationHit[] = BENCH.map((item) => {
  const grams = wordTrigrams(item.q)
  let best = { maxSim: 0, source: '—' }
  for (const doc of CORPUS) {
    const sim = containment(grams, wordTrigrams(doc.text))
    if (sim > best.maxSim) best = { maxSim: sim, source: doc.id }
  }
  return best
})

export const DEFAULT_CONTAM_THRESHOLD = 0.5

export const contaminationReport = (threshold: number) => {
  const flagged = CONTAMINATION.map((c) => c.maxSim >= threshold)
  const reported = BENCH.filter((b) => b.correct).length / BENCH.length
  const clean = BENCH.filter((_, i) => !flagged[i])
  const honest = clean.length === 0 ? 0 : clean.filter((b) => b.correct).length / clean.length
  return { flagged, reported, honest, cleanCount: clean.length }
}

/* ── §4 · prompt sensitivity ──────────────────────────────────── */

/** Hand-set accuracies; the ranking flip is the documented phenomenon, the values are ours. */
export const FORMATS: { id: string; label: string; a: number; b: number }[] = [
  { id: 'letters', label: 'options as A/B/C/D', a: 71, b: 66 },
  { id: 'fulltext', label: 'options written out', a: 63, b: 67 },
  { id: 'fewshot', label: '5-shot examples', a: 72, b: 68 },
  { id: 'zeroshot', label: '0-shot', a: 66, b: 61 },
  { id: 'strict', label: 'strict "Answer:" parsing', a: 57, b: 62 },
]

export const formatSpread = (key: 'a' | 'b') => {
  const vals = FORMATS.map((f) => f[key])
  return { min: Math.min(...vals), max: Math.max(...vals) }
}
