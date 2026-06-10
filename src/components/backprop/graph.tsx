import { type Evaluation, fmt, type NodeId } from './model'

const W = 760
const H = 312
const NODE_W = 108
const NODE_H = 58

type NodeSpec = {
  x: number
  y: number
  label: string
  leaf?: boolean
}

const NODES: Record<NodeId, NodeSpec> = {
  a: { x: 16, y: 30, label: 'a · input', leaf: true },
  b: { x: 16, y: 118, label: 'b · input', leaf: true },
  c: { x: 16, y: 206, label: 'c · input', leaf: true },
  u: { x: 178, y: 74, label: 'u = a × b' },
  d: { x: 340, y: 140, label: 'd = u + c' },
  t: { x: 478, y: 140, label: 't = tanh(d)' },
  f: { x: 478, y: 238, label: 'f · input', leaf: true },
  L: { x: 636, y: 189, label: 'L = t × f' },
}

const EDGES: [NodeId, NodeId][] = [
  ['a', 'u'],
  ['b', 'u'],
  ['u', 'd'],
  ['c', 'd'],
  ['d', 't'],
  ['t', 'L'],
  ['f', 'L'],
]

const right = (id: NodeId) => ({ x: NODES[id].x + NODE_W, y: NODES[id].y + NODE_H / 2 })
const left = (id: NodeId) => ({ x: NODES[id].x, y: NODES[id].y + NODE_H / 2 })

function edgePath(from: NodeId, to: NodeId): string {
  const s = right(from)
  const e = left(to)
  const mid = (s.x + e.x) / 2
  return `M${s.x},${s.y} C${mid},${s.y} ${mid},${e.y} ${e.x},${e.y}`
}

/**
 * The computation graph. Forward values always show; gradients appear
 * node by node as the backward pass is stepped through. The active step's
 * node and its downstream edge light up vermillion.
 */
export function BackpropGraph({
  evaluation,
  revealed,
  active,
}: {
  evaluation: Evaluation
  revealed: ReadonlySet<NodeId>
  active: NodeId | null
}) {
  // the edge the gradient just flowed along: active node → its consumer
  const activeEdge = active ? EDGES.find(([from]) => from === active) : undefined

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label="Computation graph for L = tanh(a times b plus c) times f"
    >
      <title>The computation graph</title>
      {EDGES.map(([from, to]) => {
        const isActive = activeEdge?.[0] === from && activeEdge?.[1] === to
        return (
          <g key={`${from}-${to}`}>
            <path
              d={edgePath(from, to)}
              fill="none"
              stroke={isActive ? 'var(--color-vermillion)' : 'var(--color-ink-faint)'}
              strokeWidth={isActive ? 2.5 : 1.25}
            />
            {isActive && (
              // gradient flows backward: arrowhead at the *source* end of the forward edge
              <circle cx={right(from).x} cy={right(from).y} r="4" fill="var(--color-vermillion)" />
            )}
          </g>
        )
      })}
      {(Object.keys(NODES) as NodeId[]).map((id) => {
        const n = NODES[id]
        const isActive = active === id
        const hasGrad = revealed.has(id)
        return (
          <g key={id}>
            <rect
              x={n.x}
              y={n.y}
              width={NODE_W}
              height={NODE_H}
              rx="4"
              fill={isActive ? 'var(--color-paper-deep)' : 'var(--color-paper-bright)'}
              stroke={isActive ? 'var(--color-vermillion)' : 'var(--color-paper-edge)'}
              strokeWidth={isActive ? 2 : 1.25}
              strokeDasharray={n.leaf ? '3 3' : undefined}
            />
            <text
              x={n.x + 10}
              y={n.y + 16}
              fontFamily="var(--font-mono)"
              fontSize="10"
              letterSpacing="0.04em"
              fill="var(--color-ink-faint)"
            >
              {n.label}
            </text>
            <text
              x={n.x + 10}
              y={n.y + 34}
              fontFamily="var(--font-mono)"
              fontSize="13"
              fontWeight="600"
              fill="var(--color-ink)"
            >
              {fmt(evaluation.values[id])}
            </text>
            <text
              x={n.x + 10}
              y={n.y + 50}
              fontFamily="var(--font-mono)"
              fontSize="10.5"
              fill="var(--color-vermillion)"
              opacity={hasGrad ? 1 : 0}
            >
              ∂L/∂{id} = {fmt(evaluation.grads[id])}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
