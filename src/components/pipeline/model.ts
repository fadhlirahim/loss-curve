/**
 * The full small-LLM pipeline as typed data: pretrain → mid-train (optional)
 * → SFT → eval. Costs and token counts are nanochat speedrun ballparks
 * (the ≈$100 / ~4 h / 8×H100 tier) — proportions matter, not the digits.
 * The §2 outputs are hand-written illustrations of each stage's
 * characteristic behavior, not sampled from a real model.
 */

export type StageId = 'pretrain' | 'midtrain' | 'sft' | 'eval'

type Stage = {
  id: StageId
  name: string
  optional?: boolean
  tagline: string
  /** What the artifact is after this stage — the evolving model card. */
  modelCard: string[]
  dataIn: string
  objective: string
  artifactOut: string
  cost: string
  breaksWithout: string
}

export const STAGES: Stage[] = [
  {
    id: 'pretrain',
    name: 'pretrain',
    tagline: 'read the internet, predict the next token',
    modelCard: ['base'],
    dataIn: 'FineWeb-EDU-style web text — ≈11B tokens at speedrun scale',
    objective: 'next-token prediction on raw web text; every token is a training signal',
    artifactOut: 'a base model — it completes text; it does not answer you',
    cost: '≈3–4 h on 8×H100 · ≈$80 — the overwhelming bulk of the budget',
    breaksWithout:
      'skip it and there is no language at all — SFT on a random init produces gibberish that apes chat formatting',
  },
  {
    id: 'midtrain',
    name: 'mid-train',
    optional: true,
    tagline: 'same loop, curated data',
    modelCard: ['base', '+domain'],
    dataIn:
      'a smaller curated corpus — conversation format, multiple-choice, tool-use traces; ≈0.5–1B tokens',
    objective: 'still next-token — the loop is untouched; only the data distribution moved',
    artifactOut: 'a domain-stronger base — same interface, better priors for what comes next',
    cost: '≈30–40 min · ≈$10 — cheap because the corpus is small',
    breaksWithout:
      'nothing breaks — it is optional. You lose the few benchmark points the curated data would have bought',
  },
  {
    id: 'sft',
    name: 'SFT',
    tagline: 'same loop, chat transcripts',
    modelCard: ['chat'],
    dataIn:
      'chat transcripts (user/assistant turns) — tens of millions of tokens, loss only on assistant tokens',
    objective: "next-token again — but the only tokens that count are the assistant's replies",
    artifactOut: 'a chat model — it answers instead of continuing; the "personality" lives here',
    cost: '≈10–20 min · ≈$5 — behavior is cheap once knowledge exists',
    breaksWithout:
      'skip it and the model completes your question instead of answering it (§2 shows exactly this)',
  },
  {
    id: 'eval',
    name: 'eval',
    tagline: 'no gradient — just measurement',
    modelCard: ['chat', '✓ measured'],
    dataIn:
      'held-out text the model never trained on, plus small benchmark suites — ARC, GSM8K, HumanEval…',
    objective:
      'no gradient. Forward passes only: loss/perplexity for the base, task accuracy for the chat model',
    artifactOut: 'a number you can trust — the only defensible answer to "did that change help?"',
    cost: 'minutes · ≈$1 — the cheapest stage and the most skipped',
    breaksWithout:
      'skip it and you are guessing — every "improvement" becomes vibes, and vibes lie (Phase 4 is largely this lesson)',
  },
]

export const PROMPT = 'What is self-attention?'

type StageOutput =
  | { kind: 'text'; label: string; text: string; note: string }
  | {
      kind: 'scorecard'
      label: string
      rows: { metric: string; value: string; comment: string }[]
      note: string
    }

export const OUTPUTS: Record<StageId, StageOutput> = {
  pretrain: {
    kind: 'text',
    label: 'base model · continues the text',
    text: 'What is multi-head attention? What is a residual stream? These are the questions every candidate faces in machine-learning interviews. In this 12-week course you will learn: Week 1 — Introduction to deep learning. Week 2 — Linear algebra refresher. Week 3 —',
    note: 'pure continuation: the base model has seen a thousand pages that look like this and keeps the pattern going. It never answers, because answering was never the objective.',
  },
  midtrain: {
    kind: 'text',
    label: 'mid-trained · continues, in-domain',
    text: '(a) a convolution over tokens (b) a weighted mix of token representations (c) a recurrent gate (d) a pooling layer. Answer: (b). Self-attention computes pairwise scores between',
    note: 'closer — the curated data was full of Q&A and multiple-choice, so continuations now look like exams. Still completion, not conversation.',
  },
  sft: {
    kind: 'text',
    label: 'chat model · answers',
    text: "Self-attention lets every token rebuild itself as a weighted blend of the tokens before it. The weights come from query–key dot products, so the mixing depends on content, not position. It's the routing mechanism the rest of the transformer is built around.",
    note: 'an actual answer: SFT taught the model that after a user question, the next tokens are an assistant reply. Same weights doing the knowing; new behavior doing the telling.',
  },
  eval: {
    kind: 'scorecard',
    label: 'eval · not an output — a scorecard',
    rows: [
      {
        metric: 'val loss (held-out web text)',
        value: '≈2.9 → ppl ≈18',
        comment: 'the base model’s honest score',
      },
      { metric: 'ARC-Easy', value: '≈60%', comment: 'chat model, 4-choice — random is 25%' },
      { metric: 'GSM8K', value: '≈5%', comment: 'grade-school math — tiny models are bad at this' },
      { metric: 'HumanEval', value: '≈7%', comment: 'code — same story' },
    ],
    note: 'a $100 model scores like a $100 model. The point of eval is that this table — not the demo that felt smart — is the deliverable. Vibes ≠ eval.',
  },
}

export const LOOP_ROWS = [
  {
    stage: 'pretrain',
    tokens: '≈11B',
    epochs: '~1',
    lr: 'warmup → cosine decay, the big LR',
    step: 'one batch of shuffled web text',
  },
  {
    stage: 'mid-train',
    tokens: '≈0.5–1B',
    epochs: '~1',
    lr: 'short schedule, lower peak',
    step: 'same loop, curated batches',
  },
  {
    stage: 'SFT',
    tokens: '≈10–100M',
    epochs: '1–2',
    lr: 'small and brief',
    step: 'same loop, loss masked to assistant tokens',
  },
  {
    stage: 'eval',
    tokens: '0 trained on',
    epochs: '—',
    lr: 'none — no gradient',
    step: 'forward pass, write the number down',
  },
]
