/**
 * Three recipes, one idea: turn a comparison into a gradient.
 *
 * Everything here is the genuine arithmetic — the Bradley–Terry sigmoid,
 * the exact DPO loss and its gradient weight, and GRPO's group-normalized
 * advantages — just evaluated on numbers small enough to read. Nothing is
 * trained on this page; the labs' job is to make the loss functions legible.
 */

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))

/** §1 — one labeled comparison, the atom of preference learning. */
export const PREF_PAIR = {
  prompt: 'Explain overfitting in one sentence.',
  chosen:
    'The model memorizes quirks of the training set instead of the underlying pattern, so it aces training data and flops on anything new.',
  rejected: 'Overfitting is when a model overfits the training data too much.',
}

/** §2 — the DPO loss on one pair, exactly as in the paper. */
export const dpo = (chosenRatio: number, rejectedRatio: number, beta: number) => {
  const margin = chosenRatio - rejectedRatio
  return {
    margin,
    rewardChosen: beta * chosenRatio,
    rewardRejected: beta * rejectedRatio,
    loss: -Math.log(sigmoid(beta * margin)),
    /** |dL/dmargin| / β — how much this pair still teaches. */
    gradWeight: sigmoid(-beta * margin),
  }
}

export const dpoLossAt = (margin: number, beta: number) => -Math.log(sigmoid(beta * margin))

/** §3 — eight attempts at one verifiable problem. */
export const GRPO_PROBLEM = 'Compute 17 × 24.'

export const ATTEMPTS = [
  { text: '17×24 = 17×20 + 17×4 = 340 + 68 = 408', correct: true },
  { text: '24×17 ≈ 25×17 = 425, call it 425', correct: false },
  { text: '17×24 = 17×25 − 17 = 425 − 17 = 408', correct: true },
  { text: '10×24 = 240, 7×24 = 158, total 398', correct: false },
  { text: 'double 17 four times: 34, 68, 136, 272', correct: false },
  { text: '408', correct: true },
  { text: '17 + 24 = 41', correct: false },
  { text: '17×24 = 17×4×6 = 68×6 = 408', correct: true },
]

/** Group-normalized advantages; a uniform group has no signal at all. */
export const groupAdvantages = (rewards: number[]) => {
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length
  const variance = rewards.reduce((a, r) => a + (r - mean) ** 2, 0) / rewards.length
  const std = Math.sqrt(variance)
  if (std === 0) return { advantages: rewards.map(() => 0), uniform: true, mean, std }
  return { advantages: rewards.map((r) => (r - mean) / std), uniform: false, mean, std }
}

/** §4 — the family, one honest row each. */
export const FAMILY = [
  {
    name: 'RLHF (PPO)',
    eats: 'human comparisons → train a reward model → online rollouts scored by it',
    needs: 'reward model + value network + frozen reference — four models in memory',
    breaks: 'reward hacking: the policy finds the gaps in the learned proxy',
  },
  {
    name: 'DPO',
    eats: 'offline preference pairs, straight into the loss — no reward model step',
    needs: 'just the frozen reference model',
    breaks:
      'overfits its fixed dataset; pairs go stale as the policy drifts from whoever wrote them',
  },
  {
    name: 'GRPO / RLVR',
    eats: 'online rollouts scored by a programmatic checker — no humans in the loop',
    needs: 'just the frozen reference — the group mean replaces the critic',
    breaks:
      'uniform groups (all right or all wrong) give zero gradient; KL/entropy collapse when the leash slips',
  },
]
