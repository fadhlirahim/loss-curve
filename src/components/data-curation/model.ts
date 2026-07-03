/**
 * A toy web crawl, curated with the real algorithms: heuristic quality
 * filters (the same statistics FineWeb-style pipelines threshold on),
 * exact + near deduplication (Jaccard over word 3-grams), and a unigram
 * payoff measurement (cross-entropy of a held-out sentence, add-one
 * smoothed). Fourteen tiny documents instead of a trillion tokens, so
 * every score is checkable by eye — the mechanics are unchanged.
 */

export type Doc = { id: string; text: string }

const C1 =
  'the bird ate the worm because it was hungry. after the meal it sat in the sun and cleaned its feathers. when the rain came it hid under the leaves and waited for morning.'

export const DOCS: Doc[] = [
  { id: 'doc-01', text: C1 },
  {
    id: 'doc-02',
    text: 'Home | About | Contact | Sign in | Privacy Policy | Terms | Cookies | Careers | © 2026 Example Corp',
  },
  {
    id: 'doc-03',
    text: 'small birds learn songs from their parents. a young bird practices for weeks until the song comes out right.',
  },
  { id: 'doc-04', text: C1 },
  {
    id: 'doc-05',
    text: 'best bird food best bird food cheap bird food buy bird food online bird food deals top rated bird food near me bird food sale',
  },
  {
    id: 'doc-06',
    text: 'the river rises in spring when the snow melts. farmers watch the water and plan their planting around it.',
  },
  { id: 'doc-07', text: C1.replace('the sun and', 'the shade and') },
  {
    id: 'doc-08',
    text: 'if (x_1 == y_2) { return z_3; } else { q += 0xFF; } // ??? $$ %% @@ ~~ [[ ]] << >>',
  },
  {
    id: 'doc-09',
    text: 'bread needs flour, water, salt and time. the dough rests overnight and bakes in a hot oven in the morning.',
  },
  {
    id: 'doc-10',
    text: 'Menu Home Products Pricing Blog Careers Support Sign Up Follow Facebook Twitter Instagram Newsletter Subscribe',
  },
  { id: 'doc-11', text: C1 },
  { id: 'doc-12', text: 'click here to read more' },
  {
    id: 'doc-13',
    text: 'so it goes: sun up, sun down. we eat, we rest, we try again. a small life, but a good one.',
  },
  { id: 'doc-14', text: C1.replace('cleaned its feathers', 'cleaned its wings') },
]

const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'but',
  'it',
  'its',
  'is',
  'was',
  'were',
  'be',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'for',
  'with',
  'from',
  'we',
  'you',
  'they',
  'their',
  'he',
  'she',
  'this',
  'that',
  'so',
  'as',
  'after',
  'because',
  'until',
  'when',
  'while',
  'again',
  'not',
  'under',
  'over',
  'out',
  'up',
  'down',
  'one',
])

/** Whitespace tokens, lowercased; punctuation stripped from wordish tokens, pure-symbol tokens kept. */
export const tokenize = (text: string): string[] =>
  text
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => (/[a-z0-9]/.test(t) ? t.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '') : t))
    .filter(Boolean)

const alphaWords = (text: string) => tokenize(text).filter((t) => /[a-z]/.test(t))

export type Scores = {
  words: number
  meanWordLen: number
  symbolRatio: number
  stopwordFraction: number
  maxRepeat: number
}

export const scoreDoc = (text: string): Scores => {
  const words = alphaWords(text)
  const symbols = (text.match(/[^a-zA-Z0-9\s]/g) ?? []).length
  const alpha = (text.match(/[a-zA-Z]/g) ?? []).length
  const counts = new Map<string, number>()
  for (const w of words) {
    if (!STOPWORDS.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1)
  }
  return {
    words: words.length,
    meanWordLen: words.reduce((s, w) => s + w.length, 0) / Math.max(1, words.length),
    symbolRatio: symbols / Math.max(1, alpha),
    stopwordFraction: words.filter((w) => STOPWORDS.has(w)).length / Math.max(1, words.length),
    maxRepeat: Math.max(0, ...counts.values()) / Math.max(1, words.length),
  }
}

export const SCORES = new Map(DOCS.map((d) => [d.id, scoreDoc(d.text)]))

export type FilterKey = 'minWords' | 'meanWordLen' | 'symbolRatio' | 'stopwords' | 'repeat'

export type FilterSpec = {
  key: FilterKey
  label: string
  hint: string
  min: number
  max: number
  step: number
  def: number
  /** 'min': score must be ≥ threshold to pass; 'max': score must be ≤ threshold. */
  dir: 'min' | 'max'
  value: (s: Scores) => number
}

export const FILTERS: FilterSpec[] = [
  {
    key: 'minWords',
    label: 'word count',
    hint: 'fragments carry no signal',
    min: 3,
    max: 20,
    step: 1,
    def: 8,
    dir: 'min',
    value: (s) => s.words,
  },
  {
    key: 'meanWordLen',
    label: 'mean word length',
    hint: 'gibberish skews short or long',
    min: 2,
    max: 4,
    step: 0.1,
    def: 2.5,
    dir: 'min',
    value: (s) => s.meanWordLen,
  },
  {
    key: 'symbolRatio',
    label: 'symbol ratio',
    hint: 'code and markup noise',
    min: 0.05,
    max: 0.6,
    step: 0.01,
    def: 0.3,
    dir: 'max',
    value: (s) => s.symbolRatio,
  },
  {
    key: 'stopwords',
    label: 'stopword fraction',
    hint: 'real prose is full of glue words',
    min: 0,
    max: 0.4,
    step: 0.01,
    def: 0.12,
    dir: 'min',
    value: (s) => s.stopwordFraction,
  },
  {
    key: 'repeat',
    label: 'top-word repeat',
    hint: 'keyword stuffing repeats itself',
    min: 0.05,
    max: 0.5,
    step: 0.01,
    def: 0.25,
    dir: 'max',
    value: (s) => s.maxRepeat,
  },
]

export type FilterState = Record<FilterKey, { on: boolean; t: number }>

export const DEFAULT_FILTERS: FilterState = Object.fromEntries(
  FILTERS.map((f) => [f.key, { on: true, t: f.def }]),
) as FilterState

const fmtScore = (key: FilterKey, v: number) => (key === 'minWords' ? String(v) : v.toFixed(2))

/** Human-readable reasons this doc fails the enabled filters; empty = pass. */
export const rejectReasons = (doc: Doc, state: FilterState): string[] => {
  const s = SCORES.get(doc.id) ?? scoreDoc(doc.text)
  const reasons: string[] = []
  for (const f of FILTERS) {
    const { on, t } = state[f.key]
    if (!on) continue
    const v = f.value(s)
    const fails = f.dir === 'min' ? v < t : v > t
    if (fails) {
      reasons.push(
        `${f.label} ${fmtScore(f.key, v)} ${f.dir === 'min' ? '<' : '>'} ${fmtScore(f.key, t)}`,
      )
    }
  }
  return reasons
}

/* ── deduplication ────────────────────────────────────────────── */

const normalize = (text: string) => tokenize(text).join(' ')

export const trigrams = (text: string): Set<string> => {
  const words = tokenize(text)
  const grams = new Set<string>()
  for (let i = 0; i + 2 < words.length; i++) {
    grams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`)
  }
  return grams
}

export const jaccard = (a: Set<string>, b: Set<string>): number => {
  let inter = 0
  for (const g of a) {
    if (b.has(g)) inter++
  }
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

export type DedupResult = {
  kept: Doc[]
  exactDrops: { doc: Doc; of: Doc }[]
  nearDrops: { doc: Doc; of: Doc; sim: number }[]
}

/** Exact dedup by normalized text, then greedy near-dedup by 3-gram Jaccard. */
export const dedup = (docs: Doc[], threshold: number): DedupResult => {
  const exactDrops: DedupResult['exactDrops'] = []
  const seen = new Map<string, Doc>()
  const unique: Doc[] = []
  for (const doc of docs) {
    const key = normalize(doc.text)
    const first = seen.get(key)
    if (first) exactDrops.push({ doc, of: first })
    else {
      seen.set(key, doc)
      unique.push(doc)
    }
  }

  const nearDrops: DedupResult['nearDrops'] = []
  const kept: Doc[] = []
  for (const doc of unique) {
    const grams = trigrams(doc.text)
    const dup = kept
      .map((k) => ({ of: k, sim: jaccard(grams, trigrams(k.text)) }))
      .find((m) => m.sim >= threshold)
    if (dup) nearDrops.push({ doc, of: dup.of, sim: dup.sim })
    else kept.push(doc)
  }
  return { kept, exactDrops, nearDrops }
}

/** Words in `doc` that never appear in `other` — the visible diff of a near-dup pair. */
export const diffWords = (doc: Doc, other: Doc): Set<string> => {
  const theirs = new Set(tokenize(other.text))
  return new Set(tokenize(doc.text).filter((w) => !theirs.has(w)))
}

/* ── the payoff: unigram statistics ───────────────────────────── */

export const HELD_OUT = 'the young bird practices its song in the spring when the water rises.'

export const totalTokens = (docs: Doc[]): number =>
  docs.reduce((s, d) => s + tokenize(d.text).length, 0)

export const topTokens = (docs: Doc[], n: number): { token: string; count: number }[] => {
  const counts = new Map<string, number>()
  for (const doc of docs) {
    for (const t of tokenize(doc.text)) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([token, count]) => ({ token, count }))
    .sort((a, b) => b.count - a.count || a.token.localeCompare(b.token))
    .slice(0, n)
}

/** Cross-entropy (nats/token) of `sentence` under the corpus unigram model, add-one smoothed. */
export const crossEntropy = (docs: Doc[], sentence: string): number => {
  const counts = new Map<string, number>()
  for (const doc of docs) {
    for (const t of tokenize(doc.text)) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  const heldOut = tokenize(sentence)
  const vocab = new Set([...counts.keys(), ...heldOut])
  const total = [...counts.values()].reduce((a, b) => a + b, 0)
  const logProb = (t: string) => Math.log(((counts.get(t) ?? 0) + 1) / (total + vocab.size))
  return -heldOut.reduce((s, t) => s + logProb(t), 0) / heldOut.length
}
