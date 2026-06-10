/**
 * The tiny computation graph the whole page teaches:
 *
 *   u = a × b
 *   d = u + c
 *   t = tanh(d)
 *   L = t × f
 *
 * Small enough to hold in your head, rich enough to show all three
 * local-derivative rules: × swaps the inputs, + passes the gradient
 * through, tanh scales by its slope (1 − t²).
 */

export type Params = { a: number; b: number; c: number; f: number }

export type NodeId = 'a' | 'b' | 'c' | 'f' | 'u' | 'd' | 't' | 'L'

export type Evaluation = {
  values: Record<NodeId, number>
  grads: Record<NodeId, number>
}

export const DEFAULT_PARAMS: Params = { a: 1.2, b: 0.8, c: -0.4, f: 1.6 }

export function evaluate(p: Params): Evaluation {
  // forward pass
  const u = p.a * p.b
  const d = u + p.c
  const t = Math.tanh(d)
  const L = t * p.f

  // backward pass — chain rule, output to inputs
  const tanhSlope = 1 - t * t
  const gL = 1
  const gt = gL * p.f
  const gf = gL * t
  const gd = gt * tanhSlope
  const gu = gd
  const gc = gd
  const ga = gu * p.b
  const gb = gu * p.a

  return {
    values: { a: p.a, b: p.b, c: p.c, f: p.f, u, d, t, L },
    grads: { a: ga, b: gb, c: gc, f: gf, u: gu, d: gd, t: gt, L: gL },
  }
}

/** L as a function of one input `a`, everything else fixed — for the slope plot. */
export function lossAt(a: number, p: Params): number {
  return Math.tanh(a * p.b + p.c) * p.f
}

export const fmt = (n: number) => (Object.is(n, -0) ? '0.00' : n.toFixed(2))

export type Step = {
  node: NodeId
  rule: string
  formula: (e: Evaluation) => string
  note: string
}

/** The backward pass, in the order you'd walk it: output back to the leaves. */
export const STEPS: Step[] = [
  {
    node: 'L',
    rule: 'the seed',
    formula: () => '∂L/∂L = 1',
    note: 'Every backward pass starts the same way: the output moves 1-for-1 with itself. This 1 is the gradient that everything upstream multiplies into.',
  },
  {
    node: 't',
    rule: '× swaps the inputs',
    formula: (e) => `∂L/∂t = f · ∂L/∂L = ${fmt(e.values.f)}`,
    note: 'L = t × f, so wiggling t moves L by f per unit. The local derivative of a multiply with respect to one input is the other input.',
  },
  {
    node: 'f',
    rule: '× swaps the inputs',
    formula: (e) => `∂L/∂f = t · ∂L/∂L = ${fmt(e.values.t)}`,
    note: "Same multiply, other input: f's gradient is t. Notice both gradients came from one node's local rule times the downstream gradient — that product is the chain rule.",
  },
  {
    node: 'd',
    rule: 'tanh scales by its slope',
    formula: (e) =>
      `∂L/∂d = (1 − t²) · ∂L/∂t = ${fmt(1 - e.values.t ** 2)} × ${fmt(e.grads.t)} = ${fmt(e.grads.d)}`,
    note: 'A nonlinearity passes the gradient through scaled by its own slope at the current value. Where tanh is flat (saturated), 1 − t² ≈ 0 and the gradient dies — this is why saturation stalls learning.',
  },
  {
    node: 'u',
    rule: '+ passes it through',
    formula: (e) => `∂L/∂u = 1 · ∂L/∂d = ${fmt(e.grads.u)}`,
    note: 'Addition is a gradient distributor: d = u + c moves 1-for-1 with each input, so the downstream gradient flows through unchanged to both.',
  },
  {
    node: 'c',
    rule: '+ passes it through',
    formula: (e) => `∂L/∂c = 1 · ∂L/∂d = ${fmt(e.grads.c)}`,
    note: 'Same plus node, same gradient. c is a leaf — in a real network this would be a bias, and this number is exactly what the optimizer uses to nudge it.',
  },
  {
    node: 'a',
    rule: '× swaps the inputs',
    formula: (e) =>
      `∂L/∂a = b · ∂L/∂u = ${fmt(e.values.b)} × ${fmt(e.grads.u)} = ${fmt(e.grads.a)}`,
    note: 'Two hops from L, yet the rule is identical: local derivative (b) times whatever arrived from downstream. No node ever needs to know the whole graph.',
  },
  {
    node: 'b',
    rule: '× swaps the inputs',
    formula: (e) =>
      `∂L/∂b = a · ∂L/∂u = ${fmt(e.values.a)} × ${fmt(e.grads.u)} = ${fmt(e.grads.b)}`,
    note: "Done — every dial now knows its downhill direction. That's the entire algorithm: one local rule per node, multiplied backward. micrograd is ~100 lines because this is all there is.",
  },
]
