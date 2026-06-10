export type GlossaryGroup = {
  title: string
  intro?: string
  terms: { term: string; plain: string }[]
}

export const GLOSSARY: GlossaryGroup[] = [
  {
    title: 'The machine itself',
    terms: [
      {
        term: 'Model',
        plain:
          'A program that learned from examples instead of being given rules. The ones here are giant guess-the-next-word machines.',
      },
      {
        term: 'Neural network',
        plain:
          'How the machine is built inside: layers of simple number-mixers stacked on each other, loosely inspired by brain cells.',
      },
      {
        term: 'Parameters / weights',
        plain:
          'The millions or billions of tiny dials inside the machine. "Training a model" means turning these dials.',
      },
      {
        term: 'Token / tokenizer',
        plain:
          "Models don't read letters. The tokenizer chops text into word-pieces called tokens — those are what the model actually sees.",
      },
      {
        term: 'Embedding',
        plain: 'Turning each token into a long list of numbers, so you can do math on words.',
      },
      {
        term: 'Attention',
        plain:
          'The trick that lets the model look back at all the earlier words and decide which ones matter most for guessing the next one.',
      },
      {
        term: 'Transformer',
        plain:
          "The blueprint built around attention. Nearly every modern AI model uses it. It's the T in GPT.",
      },
      {
        term: 'LLM / GPT',
        plain:
          'Large Language Model: a big transformer trained on a huge slice of the internet to predict the next token.',
      },
      {
        term: 'GPU',
        plain:
          'The chip that does the math. Designed for video games; turned out to be perfect for neural networks.',
      },
    ],
  },
  {
    title: 'Teaching it',
    terms: [
      {
        term: 'Training',
        plain:
          'Show the machine examples; each time it guesses wrong, nudge every dial a tiny bit toward "less wrong." Repeat billions of times.',
      },
      {
        term: 'Loss',
        plain:
          'One number that says "how wrong is it right now." A falling loss curve is what learning looks like on a chart.',
      },
      {
        term: 'Gradient descent',
        plain: 'The nudging strategy: always take a small step downhill on the loss.',
      },
      {
        term: 'Backpropagation',
        plain:
          'The bookkeeping that figures out, for each of the billions of dials, which direction is downhill. The single most important algorithm in this roadmap.',
      },
      {
        term: 'Learning rate',
        plain:
          'How big each nudge is. Too big and training goes haywire; too small and it takes forever.',
      },
      {
        term: 'Overfitting',
        plain:
          'Memorizing the homework instead of learning the subject. The model aces the practice questions and fails the real exam.',
      },
      {
        term: 'Pretraining',
        plain:
          'The first, giant phase of training: pure next-word guessing over an enormous pile of text.',
      },
      {
        term: 'Scaling laws / Chinchilla',
        plain:
          'The math of how much text a model of a given size should be fed — roughly 20 tokens for every parameter.',
      },
      {
        term: 'MFU',
        plain:
          "What fraction of your GPU's theoretical horsepower you're actually using. Low MFU = paying for a sports car, driving it in first gear.",
      },
    ],
  },
  {
    title: 'Shaping it after school (post-training)',
    terms: [
      {
        term: 'Fine-tuning / SFT',
        plain:
          'A short second school after pretraining: show the model worked examples of being a helpful assistant, so it stops just rambling text.',
      },
      {
        term: 'RLHF',
        plain:
          'Teaching with thumbs-up / thumbs-down instead of right answers: humans rate responses, the model learns to get more thumbs-up.',
      },
      {
        term: 'Reward model / reward hacking',
        plain:
          "A judge program that scores the model's answers. Reward hacking is the model finding sneaky ways to score points without actually being good — like a student gaming a rubric.",
      },
      {
        term: 'DPO / GRPO / RLVR',
        plain:
          'Newer, simpler recipes for the same thumbs-up idea. RLVR is the special case where the reward can be checked mechanically (did the math answer come out right?), which is how reasoning models are trained.',
      },
      {
        term: 'LoRA',
        plain:
          'A fine-tuning shortcut: instead of adjusting all the dials, bolt on a small set of new ones and adjust only those. Cheap enough for one GPU.',
      },
      {
        term: 'Quantization / distillation / pruning',
        plain:
          'Three ways to shrink a model: store the dials with fewer decimal places · have a small student model copy a big teacher · cut the parts that turn out not to matter.',
      },
    ],
  },
  {
    title: 'Doing science on it',
    terms: [
      {
        term: 'Eval / benchmark',
        plain:
          'The model\'s exam. Evals "lie" when the model saw the answers during training, or when the exam doesn\'t measure what you actually care about.',
      },
      {
        term: 'Baseline',
        plain:
          'The thing you compare against. "My model scores 80" means nothing; "80 versus 72 for the same-size standard model" means something.',
      },
      {
        term: 'Ablation',
        plain:
          'Remove or change exactly one ingredient, rerun, and see what difference it made. The basic unit of ML science.',
      },
      {
        term: 'Seed',
        plain:
          'The starting roll of the dice for a training run. Run with at least 3 different seeds, or your "result" might just be luck.',
      },
      {
        term: 'Confound',
        plain:
          'A second difference that sneaks into your comparison and ruins it — you changed the optimizer and accidentally the model size, so which one helped?',
      },
      {
        term: 'Reproduce',
        plain:
          "Redo someone's published experiment from scratch and get the same numbers. Where most of the real learning lives.",
      },
      {
        term: 'Mechanistic interpretability',
        plain:
          'Opening up the machine to figure out what the dials are actually doing inside — circuit-tracing for neural networks.',
      },
      {
        term: 'Artifact',
        plain:
          'The proof you actually did the work: a public repo, a trained model, a writeup that a stranger could check and build on.',
      },
    ],
  },
]
