export type ChecklistItem = {
  id: string
  text: string
}

/** In-app interactive explainer routes a learn topic can link to. */
export type LearnRoute =
  | '/learn/backprop'
  | '/learn/gradient-descent'
  | '/learn/neural-net'
  | '/learn/core-ml'
  | '/learn/math'
  | '/learn/attention'
  | '/learn/transformer-block'
  | '/learn/tokenizer'
  | '/learn/positions'
  | '/learn/training-loop'
  | '/learn/pipeline'
  | '/learn/scaling-laws'
  | '/learn/gpu-systems'
  | '/learn/data-curation'
  | '/learn/optimization'
  | '/learn/efficiency'
  | '/learn/sft'
  | '/learn/preference-tuning'
  | '/learn/reward-hacking'
  | '/learn/evals'
  | '/learn/sampling'

export type Phase = {
  slug: string
  number: number
  title: string
  weeks: string
  tagline: string
  goal: string
  gap: string
  learn: { title: string; detail: string; to?: LearnRoute; badge?: string }[]
  path: { title: string; detail: string; href?: string }[]
  deliverable: string
  milestones: ChecklistItem[]
  artifact: string
  levelNote?: string
  traps: { title: string; detail: string }[]
}

export const PHASES: Phase[] = [
  {
    slug: '0',
    number: 0,
    title: 'Orientation',
    weeks: '≈ 1 week',
    tagline: 'Kill the paralysis. Ship a trained model in your first few days.',
    goal: 'Kill the "I don\'t know where to start" paralysis by shipping a trained model in your first few days, set up a research environment you\'ll actually keep, and start the two habits — a log and reading — that run through every later phase.',
    gap: "You're a strong engineer. The trap at the start isn't capability — it's spending three weeks \"preparing to learn.\" Don't. The point of this week is momentum and a working loop, not understanding. Understanding comes in Phase 1.",
    learn: [
      {
        title: 'Environment (half a day)',
        detail:
          "Python + PyTorch. A single consumer GPU, or free Colab/Kaggle to start — don't spend money yet. Confirm torch sees your GPU/MPS. Don't over-build the setup; you'll redo it later.",
      },
      {
        title: 'First vertical slice (1–2 days)',
        detail:
          "Run the fast.ai Lesson 1 notebook, or train nanoGPT on tiny-shakespeare following the README (nanoGPT is deprecated but frozen — ideal for a first run: it will never change under you). Watch a real training loop run and a loss curve drop. You will not understand most of it. That's fine.",
      },
      {
        title: 'Public scaffolding (half a day)',
        detail:
          'A GitHub repo (e.g. learning-ml), a research log (LOG.md — one entry per session; the single highest-ROI habit in the roadmap), and a paper-notes folder.',
      },
      {
        title: 'Join one community (1 hour)',
        detail:
          "The EleutherAI Discord (#beginners / #research) is the highest-signal home for independent model researchers. Make an account, read, don't post yet.",
      },
      {
        title: 'Set your target (1 hour)',
        detail:
          'Re-read the Levels ladder. Write one line in your log: "My 6-month target is L2 — run a clean extension of a small-models result." Vague goals produce vague effort.',
      },
    ],
    path: [
      {
        title: 'fast.ai Lesson 1 or nanoGPT on tiny-shakespeare',
        detail: 'Either gets a real loss curve dropping on day one. Pick one, run it today.',
        href: 'https://github.com/karpathy/nanoGPT',
      },
      {
        title: 'TinyStories (arXiv 2305.07759)',
        detail: 'Your first figures-first paper skim — short and motivating.',
        href: 'https://arxiv.org/abs/2305.07759',
      },
    ],
    deliverable:
      'A public repo with a loss curve screenshot and a started LOG.md. Trained something end-to-end, even without understanding it yet.',
    milestones: [
      { id: 'p0-env', text: 'Environment works (torch sees your GPU/MPS, or Colab set up)' },
      { id: 'p0-train', text: 'Trained something end-to-end; loss curve screenshotted in a repo' },
      { id: 'p0-log', text: 'LOG.md started (first dated entry written)' },
      {
        id: 'p0-paper',
        text: 'First paper skimmed figures-first + 3-sentence note (try TinyStories)',
      },
      { id: 'p0-community', text: 'EleutherAI joined' },
    ],
    artifact: 'A public repo with a loss curve and a log.',
    traps: [
      {
        title: 'Tooling rabbit holes',
        detail:
          "Don't spend the week on the perfect dev environment, dotfiles, or a GPU rig. Colab is fine for now.",
      },
      {
        title: '"I need to understand it first"',
        detail:
          'No. Run it, then understand it. Inverting that instinct is the whole point of this week.',
      },
      {
        title: 'Skipping the log',
        detail:
          'The log is your external memory and the raw material of your first writeups. Start it now or you never will.',
      },
    ],
  },
  {
    slug: '1',
    number: 1,
    title: 'Foundations',
    weeks: '≈ 4–8 weeks',
    tagline: 'Backprop, gradient descent, and a neural net — from a blank file.',
    goal: 'Understand and implement from a blank file the machinery under every model: gradient descent, backpropagation, a neural net, and the core ML concepts (loss, generalization, overfitting). Pull in exactly the math each step requires — no more.',
    gap: 'You can already write code; what you lack is the intuition for why neural nets train, what a gradient is doing, and the ML grammar (bias/variance, regularization, optimization) that makes experiments interpretable. This phase converts "I can call .backward()" into "I know exactly what .backward() computes and could write it myself."',
    learn: [
      {
        title: 'Backpropagation',
        detail:
          'The chain rule applied to a computation graph. The single most important thing in this phase. Implement reverse-mode autodiff and most of deep learning stops being magic.',
        to: '/learn/backprop',
      },
      {
        title: 'Gradient descent & optimizers',
        detail: 'SGD, momentum, Adam; learning rate, and why it matters most.',
        to: '/learn/gradient-descent',
      },
      {
        title: 'A neural net from scratch',
        detail: 'MLP, activations, initialization, why depth helps.',
        to: '/learn/neural-net',
      },
      {
        title: 'Core ML',
        detail:
          "Loss functions (cross-entropy especially), train/val/test, overfitting, regularization, bias–variance. The grammar of every experiment you'll run.",
        to: '/learn/core-ml',
      },
      {
        title: 'Math, just-in-time',
        detail:
          'Linear algebra (what a matrix does to a vector), calculus (the chain rule), probability (cross-entropy/KL). Learn each when the model above forces you to.',
        to: '/learn/math',
        badge: 'the ledger',
      },
    ],
    path: [
      {
        title: 'Karpathy — Neural Networks: Zero to Hero',
        detail:
          "The spine of this phase. Do the exercises, don't just watch. Build micrograd (a tiny reverse-mode autodiff engine — this IS backprop) and makemore (a character-level LM, bigram → MLP).",
        href: 'https://karpathy.ai/zero-to-hero.html',
      },
      {
        title: '3Blue1Brown — Neural Networks series',
        detail:
          "The best visual intuition for nets, gradients, and backprop. Watch the matching chapter when something won't click.",
        href: 'https://www.youtube.com/watch?v=aircAruvnKk&list=PLZHQObOWTQDNU6R1_67000Dx_ZCJB-3pi',
      },
      {
        title: 'fast.ai or d2l.ai — one breadth source, as reference',
        detail: "Use to fill gaps Karpathy doesn't cover, not cover-to-cover.",
        href: 'https://course.fast.ai',
      },
      {
        title: 'Mathematics for Machine Learning (Deisenroth et al.)',
        detail: "Math reference — look up, don't read linearly.",
        href: 'https://mml-book.github.io',
      },
    ],
    deliverable:
      'Reimplement micrograd and makemore yourself, from scratch — watch a segment, close it, rebuild from memory and first principles. Push both with a README. Bonus: a short note, "what backprop actually computes."',
    milestones: [
      {
        id: 'p1-autodiff',
        text: 'Reverse-mode autodiff implemented from a blank file (your own micrograd)',
      },
      { id: 'p1-gradient', text: 'Hand-derived one gradient to check it' },
      {
        id: 'p1-mlp',
        text: 'MLP built, trained, and debugged without copying (diagnosed a bad LR from the curve)',
      },
      {
        id: 'p1-explain',
        text: 'Can explain in your log: cross-entropy, train/val split, overfitting + 3 fixes',
      },
      { id: 'p1-makemore', text: 'makemore reimplemented (bigram → MLP char-LM)' },
    ],
    artifact: 'micrograd + makemore repos + a "what backprop computes" note.',
    levelNote: 'Level 1 (Reproducer) begins',
    traps: [
      {
        title: 'Watching instead of building',
        detail:
          'Karpathy makes it look easy; that\'s the danger. Close the video and rebuild from a blank file. The gap between "followed along" and "can implement" is the entire point.',
      },
      {
        title: 'Math-first detour',
        detail:
          'Do not stop to "finish" a linear algebra course. Look math up when micrograd forces the question, then return.',
      },
      {
        title: 'Copy-paste completion',
        detail:
          'Copying his code and running it teaches almost nothing. Type it from understanding, or rebuild from memory.',
      },
    ],
  },
  {
    slug: '2',
    number: 2,
    title: 'Transformers & LLMs',
    weeks: '≈ 4–8 weeks',
    tagline: 'Build and train a GPT from a blank file. No black boxes left.',
    goal: 'Build and train a GPT-style transformer from a blank file, understand every component (tokenizer → embeddings → attention → MLP → logits), and run the full small-LLM pipeline end to end at least once.',
    gap: 'Most people use transformers as an API; you\'ll understand them as a mechanism. This is the difference between "I fine-tuned a model" and "I can reason about why it behaves as it does" — the foundation for every research idea you\'ll later have.',
    learn: [
      {
        title: 'Self-attention',
        detail:
          'Queries/keys/values, multi-head attention, causal masking. Implement it from scratch; this is the centerpiece.',
        to: '/learn/attention',
      },
      {
        title: 'The transformer block',
        detail: 'Attention + MLP, residual connections, LayerNorm/RMSNorm, why each is there.',
        to: '/learn/transformer-block',
      },
      {
        title: 'Tokenization',
        detail:
          'BPE, why subword, how the tokenizer shapes everything downstream — an underrated source of bugs and quality.',
        to: '/learn/tokenizer',
      },
      {
        title: 'Positional information',
        detail: 'Learned vs RoPE; why attention needs it at all.',
        to: '/learn/positions',
      },
      {
        title: 'The training loop at language scale',
        detail: 'Data loading, batching, LR schedule, evaluation by loss/perplexity.',
        to: '/learn/training-loop',
      },
      {
        title: 'The full pipeline',
        detail:
          "Pretrain → (optional) mid-train → SFT → eval, so you've seen the whole shape once before Phases 3–4 deepen each part.",
        to: '/learn/pipeline',
      },
    ],
    path: [
      {
        title: 'Karpathy — "Let\'s build GPT" + nanoGPT',
        detail:
          'Build a GPT from a blank file, then study nanoGPT as the clean reference — deprecated since Nov 2025 in favor of nanochat (below), but still the shortest complete GPT you can hold in your head. Train on tiny-shakespeare, then a slightly bigger corpus.',
        href: 'https://github.com/karpathy/nanoGPT',
      },
      {
        title: 'Raschka — Build a Large Language Model (From Scratch)',
        detail:
          'The most thorough code-first walk through every component, including loading real pretrained weights (GPT-2 → Llama).',
        href: 'https://github.com/rasbt/LLMs-from-scratch',
      },
      {
        title: 'Karpathy — nanochat',
        detail:
          "nanoGPT's official successor. Reproduce the entire modern stack once: tokenizer → pretrain → mid-train → SFT → eval → chat UI. The model is weak; running the whole pipeline is the point.",
        href: 'https://github.com/karpathy/nanochat',
      },
      {
        title: 'Jay Alammar — The Illustrated Transformer',
        detail: 'The clearest visual explainer of attention. Read alongside the code.',
        href: 'https://jalammar.github.io/illustrated-transformer/',
      },
      {
        title: 'Papers: Attention Is All You Need · GPT-1 · BERT',
        detail:
          "Read them, don't just cite them. The Transformer paper is the one to actually read this phase.",
        href: 'https://arxiv.org/abs/1706.03762',
      },
    ],
    deliverable:
      'Train a small GPT from a blank file and write up one thing you investigated — e.g. how final loss changes with depth at fixed params. A question → an experiment → a finding. Your first taste of research, not just implementation.',
    milestones: [
      {
        id: 'p2-attention',
        text: 'Multi-head causal self-attention from a blank file, every line explained',
      },
      {
        id: 'p2-rope',
        text: 'Can explain why attention needs positional info + how RoPE provides it',
      },
      {
        id: 'p2-bpe',
        text: 'Built a small BPE tokenizer; can name one way tokenization hurts quality',
      },
      { id: 'p2-gpt', text: 'Trained a GPT end-to-end; read its loss/perplexity' },
      { id: 'p2-nanochat', text: "Reproduced nanochat's full pipeline once" },
      {
        id: 'p2-question',
        text: 'Answered one empirical question about your model (a finding, not just a run)',
      },
    ],
    artifact: 'A from-scratch GPT repo + a short investigation writeup. → Level 1 reached.',
    traps: [
      {
        title: 'Treating attention as a formula to memorize',
        detail:
          'Implement it, visualize the attention weights, perturb it. Understand it as a mechanism, not an equation.',
      },
      {
        title: 'Skipping the tokenizer',
        detail: "It's boring and it's where subtle quality bugs live. Build a small BPE once.",
      },
      {
        title: 'Stopping at "it trains"',
        detail:
          'The deliverable is a question answered, not a running loop. That shift — building → investigating — is what makes this Phase 2 and not Phase 0.',
      },
    ],
  },
  {
    slug: '3',
    number: 3,
    title: 'Training & systems',
    weeks: '≈ 8–12 weeks',
    tagline: 'How real models are trained efficiently. Reproduce a result, run one clean ablation.',
    goal: 'Understand how real models are trained efficiently — scaling laws, data, optimization at scale, GPU systems — and the efficiency toolkit (quantization, distillation, sparsity) that defines small-models work. Then reproduce a published result and run one clean ablation.',
    gap: 'Phase 2 taught you what a transformer is; this teaches you how the field actually builds them under real constraints — the knowledge that separates someone who can train a toy from someone who can contribute. Your single-GPU budget becomes a design constraint you engineer around rather than fight.',
    learn: [
      {
        title: 'Scaling laws',
        detail:
          'Chinchilla (compute-optimal ~20 tokens/param), what they predict and where they break. The conceptual basis for "small but well-trained."',
        to: '/learn/scaling-laws',
      },
      {
        title: 'Efficiency / GPU systems',
        detail:
          'Mixed precision (bf16), MFU, memory vs compute, FlashAttention, a reading-level grasp of kernels (Triton) and parallelism. Know where the time and memory go.',
        to: '/learn/gpu-systems',
      },
      {
        title: 'Data',
        detail:
          'The biggest lever in practice. Curation, filtering, deduplication; why data quality often beats architecture (TinyStories → Phi → SmolLM).',
        to: '/learn/data-curation',
      },
      {
        title: 'Optimization at scale',
        detail:
          'LR schedules, warmup, the modern optimizer landscape (AdamW, Muon), gradient accumulation, batch-size effects.',
        to: '/learn/optimization',
      },
      {
        title: 'The small-models efficiency toolkit',
        detail:
          'Quantization (GPTQ/AWQ/GGUF), knowledge distillation, pruning/sparsity, efficient architectures. Read enough to run experiments in each.',
        to: '/learn/efficiency',
      },
    ],
    path: [
      {
        title: 'Stanford CS336 — Language Modeling from Scratch',
        detail:
          "The flagship for this phase. Tokenizer, Triton FlashAttention2, distributed training, Common Crawl → pretraining data, SFT + RL. Do the assignments — that's where the systems knowledge sticks.",
        href: 'https://cs336.stanford.edu',
      },
      {
        title: 'modded-nanogpt',
        detail:
          'The speedrun repo. Read the commit history like a textbook — a masterclass in concrete, citable efficiency wins (Muon, QK-norm, value embeddings).',
        href: 'https://github.com/KellerJordan/modded-nanogpt',
      },
      {
        title: 'Papers: Chinchilla · FlashAttention · GPTQ/AWQ · Hinton distillation',
        detail: "Read, don't just cite. See the resources page for the full list.",
      },
    ],
    deliverable:
      'Reproduce a result on one GPU, then run ONE clean ablation: a single-GPU modded-nanogpt run isolating one trick (Muon vs AdamW), or a quantization quality ablation at matched bits-per-weight, or a distillation logit-sparsity study. Ship repo + reproducible eval harness + honest same-size baselines + a writeup with a plot. This artifact is your L2 credential.',
    milestones: [
      {
        id: 'p3-chinchilla',
        text: 'Can explain Chinchilla, MFU; can estimate train cost on your hardware',
      },
      {
        id: 'p3-profiler',
        text: 'Can read a profiler trace and locate the bottleneck (compute/memory/IO)',
      },
      { id: 'p3-flash', text: "Can implement or clearly explain FlashAttention's idea" },
      { id: 'p3-cs336', text: 'Did the CS336 assignments (not just the lectures)' },
      { id: 'p3-repro', text: 'Reproduced a published result on one GPU' },
      {
        id: 'p3-ablation',
        text: 'Ran ONE clean ablation (≥3 seeds, same-size baseline, one variable)',
      },
      {
        id: 'p3-design',
        text: 'Designed the ablation through the research-buddy + checked the pitfalls list first',
      },
    ],
    artifact:
      'Reproduction + ablation repo with eval harness, baselines, plot, writeup. Your L2 credential.',
    levelNote: 'Level 2 (Extender) begins',
    traps: [
      {
        title: 'Lectures without assignments',
        detail:
          "CS336's value is the implementation work. Watching lectures and skipping psets gives the illusion of systems knowledge.",
      },
      {
        title: 'Chasing the speedrun record',
        detail:
          'The 8×H100 leaderboard is a saturated multi-year competition. Reproduce on one GPU and isolate one trick.',
      },
      {
        title: 'Confounded ablations',
        detail:
          'The #1 way to produce a worthless result: vary two things at once, mismatch the baseline, or run one seed. Read the pitfalls list before designing.',
      },
      {
        title: 'Skipping data',
        detail:
          "Data quality is the highest-leverage variable in the field and the least glamorous. Don't under-weight it.",
      },
    ],
  },
  {
    slug: '4',
    number: 4,
    title: 'Post-training & eval',
    weeks: '≈ 4–8 weeks',
    tagline: 'SFT, DPO, GRPO — and evaluation as a discipline nearly everyone does badly.',
    goal: 'Understand how a raw pretrained model becomes useful — SFT, preference/RL methods (RLHF, DPO, GRPO), reward modeling, and evaluation as a rigorous discipline. Post-train a small model yourself and measure it honestly.',
    gap: 'Most applied model research today is post-training and evaluation. This is where the small-models field is hottest (small reasoning models, distilled reasoning, RLVR). And evaluation is the single most under-respected skill in the field — getting it right is a genuine differentiator.',
    learn: [
      {
        title: 'SFT / instruction tuning',
        detail:
          'Turning a base model into one that follows instructions; data formats; LoRA/QLoRA for doing it cheaply on one GPU.',
        to: '/learn/sft',
      },
      {
        title: 'Preference & RL methods',
        detail:
          'RLHF (the canonical recipe), DPO (simpler, no separate reward model), GRPO/RLVR (RL from verifiable rewards — the current frontier for reasoning).',
        to: '/learn/preference-tuning',
      },
      {
        title: 'Reward modeling',
        detail:
          "What a reward model is, reward hacking, why a verifier with skin in the game can't be a fair verifier.",
        to: '/learn/reward-hacking',
      },
      {
        title: 'Evaluation as a discipline',
        detail:
          'How benchmarks lie: contamination, prompt sensitivity, the metric–behavior gap, why pairwise beats absolute scoring. The most important sub-topic in the phase.',
        to: '/learn/evals',
      },
      {
        title: 'Inference-time methods',
        detail: 'Sampling, speculative decoding, why decoding choices change measured quality.',
        to: '/learn/sampling',
      },
    ],
    path: [
      {
        title: 'Nathan Lambert — The RLHF Book',
        detail:
          'The authoritative, current guide to post-training: RLHF, DPO, the RLVR renaissance, reward modeling, evaluation. Your spine for this phase. Free at rlhfbook.com.',
        href: 'https://rlhfbook.com',
      },
      {
        title: 'Hugging Face TRL',
        detail: 'The practical toolkit for SFT, DPO, and GRPO. Use it to actually post-train.',
        href: 'https://huggingface.co/docs/trl',
      },
      {
        title: 'DeepSeek-R1',
        detail:
          'The RL-for-reasoning (RLVR/GRPO) result that defined the current frontier. Your "small reasoning model" paper for the milestone.',
        href: 'https://arxiv.org/abs/2501.12948',
      },
    ],
    deliverable:
      'Post-train a small model (0.5–1.5B) and evaluate it honestly: SFT (LoRA) on a focused dataset, then DPO or a small GRPO loop with a verifiable reward. The research content is in the evaluation — clean harness, same-size baseline, how the reward could be gamed, what the metric does NOT capture.',
    milestones: [
      {
        id: 'p4-methods',
        text: 'Can explain SFT vs DPO vs GRPO — what each optimizes, when to use which',
      },
      { id: 'p4-hacking', text: 'Can describe reward hacking with a concrete example' },
      { id: 'p4-lies', text: 'Can name ≥3 ways an eval lies' },
      {
        id: 'p4-posttrain',
        text: 'Post-trained a small model (SFT+LoRA, then DPO or a small GRPO) with TRL',
      },
      {
        id: 'p4-eval',
        text: 'Built an honest eval harness with a same-size baseline + a stated metric limitation',
      },
      {
        id: 'p4-critique',
        text: 'Critiqued a "small reasoning model" paper\'s evaluation specifically',
      },
    ],
    artifact: 'A post-trained model + honest-eval repo + writeup. → Level 2 reached.',
    traps: [
      {
        title: 'Trusting your own numbers',
        detail:
          "The default failure mode. Assume your eval is lying until you've checked for contamination, prompt sensitivity, and a missing baseline.",
      },
      {
        title: 'Reaching for GRPO first',
        detail: "It's the exciting frontier and a debugging swamp. Earn it with SFT+DPO first.",
      },
      {
        title: 'Self-evaluation',
        detail:
          "Don't let the model (or the same prompt) grade its own work — self-preference bias is real. Separate the worker from the judge.",
      },
      {
        title: 'Metric tunnel-vision',
        detail:
          'A number going up is not a behavior improving. Always ask what the metric fails to capture.',
      },
    ],
  },
  {
    slug: '5',
    number: 5,
    title: 'Specialization & research',
    weeks: 'ongoing',
    tagline: 'Stop following a curriculum. Pick a niche, ship your first original result.',
    goal: "Stop following a curriculum and start doing research — pick a niche, produce your first original result (however small), engage a community, and ship it publicly. This phase has no end; it's the transition from learning the field to contributing to it.",
    gap: "In Phases 1–4 someone else defined the task. Here you do — first by extending published work, then by setting your own direction. That's the whole definition of a researcher.",
    learn: [
      {
        title: 'Pick a niche — deep, not wide',
        detail:
          'One sub-area where you can build a real result on one GPU: efficiency (quantization/distillation/pruning), mechanistic interpretability, data curation/synthetic data, or small reasoning models/post-training.',
      },
      {
        title: 'The research loop',
        detail:
          'Reproduce something in your niche → find the open thread (the unrun ablation, the unswept variable) → scope it (prior art, feasibility, confounds) → run it cleanly → ship the artifact.',
      },
      {
        title: 'Get visible',
        detail:
          'Ship in public — open weights + reproducible eval + writeup beats a clever-sounding paper with no artifact. EleutherAI (#research, SOAR) solves collaborators, compute, and the arXiv-endorsement gate simultaneously.',
      },
      {
        title: 'Realistic venues',
        detail:
          'ICLR Blog Posts track, NeurIPS ENLSP workshop, the ML Reproducibility Challenge. Not the main-track lottery.',
      },
    ],
    path: [
      {
        title: 'The small-models research on-ramp',
        detail:
          'Your applied specialization guide — scoped projects, the field map, the how-to-get-visible-and-publish playbook. Read it in full now.',
      },
      {
        title: 'ARENA (if interpretability)',
        detail: 'The mech-interp / alignment-engineering curriculum, with TransformerLens.',
        href: 'https://arena.education',
      },
      {
        title: 'The research-buddy',
        detail:
          'The tool for scoping and pressure-testing project ideas — prior-art check, feasibility, confound check. Essential from here on.',
      },
    ],
    deliverable:
      'Your first original result: fix one model family, one dataset, vary one axis, ≥3 seeds, same-size baseline. Ship open weights/code + reproducible eval harness + honest baselines + a clear writeup. This is your L3 credential.',
    milestones: [
      { id: 'p5-niche', text: 'Chose ONE niche and read its on-ramp section + key papers in full' },
      { id: 'p5-repro', text: 'Reproduced something in the niche as a launchpad' },
      {
        id: 'p5-thread',
        text: 'Found an open thread (the unrun ablation / unswept variable) yourself',
      },
      {
        id: 'p5-scope',
        text: 'Scoped it with the research-buddy (prior-art + feasibility + confound)',
      },
      {
        id: 'p5-ship',
        text: 'Ran it cleanly and shipped an original result publicly (weights/code + eval + writeup)',
      },
      { id: 'p5-cited', text: "Someone you don't know used / cited / built on it" },
      {
        id: 'p5-community',
        text: 'Active in a community (asking, answering, collaborating); pursued SOAR or similar',
      },
      {
        id: 'p5-questions',
        text: "You're choosing your own questions, not waiting to be assigned one",
      },
    ],
    artifact:
      'A public original result. → Level 3 reached. (Level 4 = recognized, self-directed work over years.)',
    levelNote: 'Levels 3–4',
    traps: [
      {
        title: 'Niche-hopping',
        detail:
          "Depth compounds; breadth doesn't. Stay in one sub-area long enough to develop taste before switching.",
      },
      {
        title: 'Reaching for novelty too early',
        detail:
          'Your first "original" result should be a clean extension of existing work, not an invented direction. Earn novelty.',
      },
      {
        title: 'Building tools instead of doing research',
        detail: 'Ship results, not infrastructure. (Over-investing in the research-buddy counts.)',
      },
      {
        title: 'Isolation',
        detail:
          'The single biggest accelerator available to you is a community that grants compute, gives feedback, and co-authors. Use it.',
      },
    ],
  },
]

export const WEEKLY_HABITS = [
  {
    id: 'build',
    title: 'Build / reproduce',
    detail: "One slice of the current phase's project — the core, most of your hours.",
  },
  {
    id: 'read',
    title: 'Read 2–3 papers',
    detail: 'Figures-first, each with a one-paragraph note.',
  },
  {
    id: 'write',
    title: 'Write one note',
    detail:
      'A log entry, a "what I learned / got stuck on," a short explainer — or a 20–40s animated explainer of the concept you just built.',
  },
  {
    id: 'engage',
    title: 'Engage once',
    detail: "Post a result, ask/answer in a community, read someone else's work.",
  },
] as const

export function phaseProgress(phase: Phase, checked: Record<string, boolean>) {
  const done = phase.milestones.filter((m) => checked[m.id]).length
  return { done, total: phase.milestones.length }
}

export function overallProgress(checked: Record<string, boolean>) {
  const all = PHASES.flatMap((p) => p.milestones)
  const done = all.filter((m) => checked[m.id]).length
  return { done, total: all.length, fraction: all.length ? done / all.length : 0 }
}
