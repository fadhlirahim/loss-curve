/**
 * One sentence, one attention head, every number readable.
 *
 * The queries and keys below are hand-crafted in FOUR legible dimensions
 * (thing? animate? action? glue?) instead of a real model's hundreds of
 * unlabeled ones — chosen so the dot products tell a linguistic story:
 * "it" hunts for an animate thing and finds "bird". Everything downstream
 * of these two matrices — scores, √d scaling, causal mask, softmax — is
 * the genuine attention arithmetic, computed here.
 */

export const TOKENS = ['the', 'bird', 'ate', 'the', 'worm', 'because', 'it', 'was', 'hungry']

export const DIMS = ['thing?', 'animate?', 'action?', 'glue?']

export const D_K = DIMS.length

/** What each token asks for. */
export const Q: number[][] = [
  [0.3, 0.0, 0.0, 0.7], // the
  [0.3, 0.3, 0.5, 0.3], // bird
  [1.0, 1.2, 0.0, 0.0], // ate — looking for its animate subject
  [0.3, 0.0, 0.0, 0.7], // the
  [0.2, 0.0, 1.1, 0.2], // worm — looking for its verb
  [0.0, 0.0, 0.7, 0.7], // because — looking back at the clause
  [1.3, 1.5, 0.0, 0.0], // it — hunting an animate thing
  [0.7, 0.7, 0.2, 0.3], // was — looking for its subject
  [0.6, 1.3, 0.2, 0.0], // hungry — who is hungry?
]

/** What each token advertises. */
export const K: number[][] = [
  [0.0, 0.0, 0.0, 1.0], // the
  [1.2, 1.1, 0.0, 0.0], // bird
  [0.0, 0.2, 1.2, 0.0], // ate
  [0.0, 0.0, 0.0, 1.0], // the
  [1.1, 0.3, 0.0, 0.0], // worm
  [0.0, 0.0, 0.2, 1.1], // because
  [0.8, 0.4, 0.0, 0.3], // it
  [0.0, 0.0, 0.9, 0.5], // was
  [0.3, 0.7, 0.4, 0.0], // hungry
]

/** One line of linguistic commentary per token, reused across sections. */
export const STORIES = [
  'a function word — it asks mostly for other glue, and mostly finds itself.',
  'the subject. Its key advertises "thing, alive" loudly — half the sentence will come asking for exactly that.',
  'the verb. Its query hunts for an animate thing — its subject. Watch it lock onto "bird".',
  'a function word — glue seeking glue.',
  'the object. Its query hunts for an action — the verb that governs it.',
  'a connective — it looks back at the clause it links from.',
  'the star of the sentence. An empty pointer whose query screams "animate thing?" — and "bird" answers loudest. This is pronoun resolution as arithmetic.',
  'an auxiliary verb, looking for the subject of its clause.',
  'the adjective. "Who is hungry?" — its query matches "bird" best, resolving the meaning through "it".',
]

const dot = (a: number[], b: number[]) => a.reduce((sum, x, i) => sum + x * b[i], 0)

/** Raw agreement: every query dotted with every key. */
export const RAW: number[][] = Q.map((q) => K.map((k) => dot(q, k)))

export const RAW_MAX = Math.max(...RAW.flat())

/** The same matrix ÷ √d — what actually enters softmax. */
export const SCALED: number[][] = RAW.map((row) => row.map((v) => v / Math.sqrt(D_K)))

const softmaxRow = (i: number, mask: boolean): number[] => {
  const logits = SCALED[i].map((v, j) => (mask && j > i ? Number.NEGATIVE_INFINITY : v))
  const max = Math.max(...logits)
  const exps = logits.map((v) => (v === Number.NEGATIVE_INFINITY ? 0 : Math.exp(v - max)))
  const sum = exps.reduce((a, b) => a + b, 0)
  return exps.map((e) => e / sum)
}

/** Each row: how token i spends its 100% attention budget over positions ≤ i. */
export const ATTN_CAUSAL: number[][] = TOKENS.map((_, i) => softmaxRow(i, true))

/** The bidirectional (BERT-style) variant — what unticking the mask shows. */
export const ATTN_FULL: number[][] = TOKENS.map((_, i) => softmaxRow(i, false))

export const fmt2 = (n: number) => n.toFixed(2)

export const pct = (n: number) => `${Math.round(n * 100)}%`

/** Top attention targets for token i, strongest first. */
export const topTargets = (i: number, weights: number[][] = ATTN_CAUSAL) =>
  weights[i].map((w, j) => ({ w, j })).sort((a, b) => b.w - a.w)

export type Head = {
  name: string
  desc: string
  /** Post-softmax causal attention pattern, rows summing to 1. */
  weights: number[][]
}

const headFromScores = (score: (i: number, j: number) => number): number[][] =>
  TOKENS.map((_, i) => {
    const logits = TOKENS.map((_t, j) => (j > i ? Number.NEGATIVE_INFINITY : score(i, j)))
    const max = Math.max(...logits)
    const exps = logits.map((v) => (v === Number.NEGATIVE_INFINITY ? 0 : Math.exp(v - max)))
    const sum = exps.reduce((a, b) => a + b, 0)
    return exps.map((e) => e / sum)
  })

/** Three caricatures of head types actually found in trained GPT-2. */
export const HEADS: Head[] = [
  {
    name: 'head 1 · the resolver',
    desc: 'The head from §1–§4: pronouns and adjectives hunt down the animate subject. Content-based lookup.',
    weights: ATTN_CAUSAL,
  },
  {
    name: 'head 2 · the previous-token head',
    desc: 'Attends one step back, always. Sounds trivial — real GPT-2 has these, and they feed the induction heads that do in-context learning.',
    weights: headFromScores((i, j) => (j === i - 1 ? 2.5 : 0)),
  },
  {
    name: 'head 3 · the verb tracker',
    desc: 'Keeps every word in touch with the verbs ("ate", "was") — a caricature of a syntactic head. Head outputs are concatenated, then mixed by W_O.',
    weights: headFromScores((_i, j) => (j === 2 || j === 7 ? 2.0 : 0.1)),
  },
]
