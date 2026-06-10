export type Resource = {
  name: string
  phase: string
  note: string
  href?: string
}

export type ResourceSection = {
  title: string
  intro?: string
  items: Resource[]
}

export const RESOURCE_SECTIONS: ResourceSection[] = [
  {
    title: 'Hands-on courses & code — the spine, do these',
    items: [
      {
        name: 'Karpathy — Neural Networks: Zero to Hero',
        phase: '1–2',
        note: 'The canonical from-scratch course: micrograd, makemore, build-GPT. Do the exercises.',
        href: 'https://karpathy.ai/zero-to-hero.html',
      },
      {
        name: '3Blue1Brown — Neural Networks series',
        phase: '1',
        note: "The best visual intuition for nets, gradients, and backprop. Watch when a concept won't click.",
        href: 'https://www.youtube.com/watch?v=aircAruvnKk&list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
      },
      {
        name: 'nanoGPT',
        phase: '2',
        note: 'Clean minimal GPT to study + train.',
        href: 'https://github.com/karpathy/nanoGPT',
      },
      {
        name: 'nanochat',
        phase: '2',
        note: 'The full modern stack end-to-end (tokenizer→pretrain→SFT→eval→UI).',
        href: 'https://github.com/karpathy/nanochat',
      },
      {
        name: 'The Illustrated Transformer (Jay Alammar)',
        phase: '2',
        note: 'Visual walk through attention; read alongside the code.',
        href: 'https://jalammar.github.io/illustrated-transformer/',
      },
      {
        name: 'Raschka — Build an LLM (From Scratch)',
        phase: '2',
        note: 'Thorough code-first book + repo (incl. GPT-2→Llama, Qwen-from-scratch).',
        href: 'https://github.com/rasbt/LLMs-from-scratch',
      },
      {
        name: 'fast.ai — Practical Deep Learning',
        phase: '0–1',
        note: 'Top-down, build-first DL course. Free.',
        href: 'https://course.fast.ai',
      },
      {
        name: 'Dive into Deep Learning (d2l.ai)',
        phase: '1–3',
        note: 'Free interactive textbook; use as reference.',
        href: 'https://d2l.ai',
      },
      {
        name: 'Stanford CS336 — Language Modeling from Scratch',
        phase: '3–4',
        note: 'The flagship systems course: tokenizer, FlashAttention2-in-Triton, distributed training, data, SFT+RL. Do the assignments.',
        href: 'https://cs336.stanford.edu',
      },
      {
        name: 'Hugging Face TRL',
        phase: '4',
        note: 'Practical SFT / DPO / GRPO toolkit.',
        href: 'https://huggingface.co/docs/trl',
      },
      {
        name: 'ARENA (Callum McDougall)',
        phase: '5',
        note: 'Alignment/research-engineering curriculum: DL fundamentals → transformers + mech interp → RL.',
        href: 'https://arena.education',
      },
      {
        name: 'TransformerLens',
        phase: '5 (interp)',
        note: 'The mech-interp library (induction heads, IOI in GPT-2 small).',
        href: 'https://github.com/TransformerLensOrg/TransformerLens',
      },
      {
        name: 'modded-nanogpt',
        phase: '3',
        note: 'Speedrun repo; the commit history is an efficiency masterclass.',
        href: 'https://github.com/KellerJordan/modded-nanogpt',
      },
    ],
  },
  {
    title: 'Books & long-form',
    items: [
      {
        name: 'The RLHF Book — Nathan Lambert',
        phase: '4',
        note: 'Authoritative post-training/RLHF/RLVR guide. Free online.',
        href: 'https://rlhfbook.com',
      },
      {
        name: 'Mathematics for Machine Learning — Deisenroth et al.',
        phase: '1',
        note: "Math reference (look up, don't read linearly). Free PDF.",
        href: 'https://mml-book.github.io',
      },
      {
        name: 'Deep Learning — Goodfellow, Bengio, Courville',
        phase: '1–3',
        note: "The classic theory reference; dip in, don't read cover-to-cover.",
        href: 'https://www.deeplearningbook.org',
      },
      {
        name: 'Andrew Ng — Machine Learning Specialization',
        phase: '1',
        note: 'Gentle, rigorous ML fundamentals if you want more hand-holding. (Coursera)',
      },
    ],
  },
  {
    title: "Canonical papers — read, don't just cite",
    items: [
      {
        name: 'Attention Is All You Need',
        phase: '2',
        note: 'The transformer.',
        href: 'https://arxiv.org/abs/1706.03762',
      },
      {
        name: 'GPT-1 — Improving Language Understanding by Generative Pre-Training',
        phase: '2',
        note: 'The generative-pretraining lineage (OpenAI report, not on arXiv).',
        href: 'https://cdn.openai.com/research-covers/language-unsupervised/language_understanding_paper.pdf',
      },
      {
        name: 'BERT',
        phase: '2',
        note: 'Bidirectional pre-training; the other 2018 transformer milestone.',
        href: 'https://arxiv.org/abs/1810.04805',
      },
      {
        name: 'Chinchilla — Training Compute-Optimal LLMs',
        phase: '3',
        note: 'Scaling laws; "small but well-trained."',
      },
      {
        name: 'FlashAttention',
        phase: '3',
        note: 'Memory-efficient attention; the systems mindset.',
      },
      { name: 'GPTQ / AWQ', phase: '3', note: 'Post-training quantization.' },
      {
        name: 'Distilling the Knowledge in a Neural Network (Hinton) + Sequence-Level KD',
        phase: '3',
        note: 'Distillation foundations.',
      },
      {
        name: 'TinyStories → Phi-1.5 → Phi-3 → SmolLM',
        phase: '3',
        note: 'The data-quality thread; small-model recipes.',
      },
      {
        name: 'InstructGPT / RLHF + DPO + a GRPO/RLVR paper',
        phase: '4',
        note: 'The post-training lineage.',
      },
      {
        name: 'DeepSeek-R1',
        phase: '4 / RL-3',
        note: 'RL for reasoning (RLVR); the GRPO breakthrough.',
        href: 'https://arxiv.org/abs/2501.12948',
      },
      {
        name: 'Anthropic — Transformer Circuits / induction heads',
        phase: '5 (interp)',
        note: 'Mech-interp foundations.',
      },
    ],
  },
  {
    title: 'People & newsletters — signal, low noise',
    intro:
      'Raschka + Han Lab + the Hugging Face science blog cover ~80% of what matters week-to-week.',
    items: [
      {
        name: 'Sebastian Raschka — Ahead of AI',
        phase: 'all',
        note: 'Highest signal; annual paper reading lists.',
        href: 'https://magazine.sebastianraschka.com',
      },
      {
        name: 'Lilian Weng',
        phase: 'all',
        note: 'Deep technical explainers.',
        href: 'https://lilianweng.github.io',
      },
      {
        name: 'Nathan Lambert — Interconnects',
        phase: '4',
        note: 'Post-training / RLHF pragmatics.',
      },
      {
        name: 'Neel Nanda',
        phase: '5 (interp)',
        note: 'Mech interp; "Concrete Steps to Get Started."',
        href: 'https://neelnanda.io',
      },
      {
        name: 'MIT Han Lab',
        phase: '3/5',
        note: 'The academic home of efficiency: AWQ/SmoothQuant/TinyChat.',
      },
    ],
  },
  {
    title: 'Communities, compute, venues',
    items: [
      {
        name: 'EleutherAI',
        phase: 'all',
        note: 'Discord #research + the SOAR mentored program. The highest-ROI single move.',
        href: 'https://eleuther.ai',
      },
      {
        name: 'Hugging Face',
        phase: 'all',
        note: 'Models/datasets/Spaces; Daily Papers for visibility.',
        href: 'https://huggingface.co',
      },
      {
        name: 'Compute',
        phase: 'all',
        note: 'Free Colab/Kaggle to start; Vast/RunPod community tiers for cheap rentals; granted compute via TPU Research Cloud / EleutherAI.',
      },
      {
        name: 'Venues for independents',
        phase: '5',
        note: 'ICLR Blog Posts track; NeurIPS ENLSP workshop; ML Reproducibility Challenge. Not the main-track lottery.',
      },
    ],
  },
]

export const HOW_TO_CHOOSE = [
  "Phase 1–2: Karpathy Zero-to-Hero is your primary. Raschka's book is the deeper companion. fast.ai/d2l only to patch gaps.",
  'Phase 3: CS336 is your primary — do the assignments. modded-nanogpt + the canonical papers around it.',
  'Phase 4: The RLHF Book + TRL.',
  'Phase 5: the on-ramp + (if interpretability) ARENA.',
  'RL branch: HF Deep RL course → Sutton & Barto + David Silver → Spinning Up + CleanRL + Gymnasium → RLHF Book / GRPO / RLVR.',
  'One primary per phase. Everything else is a reference, not a queue.',
]
