/**
 * The Core-ML lab reuses the MLP engine from the neural-net lab, but the
 * subject changes: not "can it learn?" but "can you tell whether what it
 * learned is real?". So the data gets a train/val split and the train
 * half gets ~10% flipped labels — every real dataset has noise, and a
 * big enough network will happily memorize it.
 */

import { makeDataset, type Point, seededRng } from '@/components/neural-net/model'

export type Split = { train: Point[]; val: Point[] }

export const LABEL_NOISE = 0.1

/**
 * Rings, split half/half into train (homework) and val (exam), with
 * LABEL_NOISE of the train labels flipped. The val set stays clean so the
 * generalization gap is unambiguous.
 */
export function makeSplit(seed: number): Split {
  const all = makeDataset('rings', seed)
  const rng = seededRng(seed * 31337 + 7)
  const train: Point[] = []
  const val: Point[] = []
  // points arrive as (class0, class1) pairs — split by pair so both halves stay balanced
  all.forEach((p, i) => {
    if (i % 4 < 2) train.push(rng() < LABEL_NOISE ? { ...p, label: p.label === 1 ? 0 : 1 } : p)
    else val.push(p)
  })
  return { train, val }
}

export const CAPACITIES = [
  { id: 'tiny', label: '1 hidden × 2 · too simple', hidden: [2] as readonly number[] },
  { id: 'right', label: '1 hidden × 8 · about right', hidden: [8] as readonly number[] },
  { id: 'huge', label: '2 hidden × 16 · oversized', hidden: [16, 16] as readonly number[] },
] as const

export type CapacityId = (typeof CAPACITIES)[number]['id']

export const DECAYS = [
  { id: 'none', label: 'λ = 0 · none', lambda: 0 },
  { id: 'light', label: 'λ = 0.001 · light', lambda: 0.001 },
  { id: 'heavy', label: 'λ = 0.01 · heavy', lambda: 0.01 },
] as const

export type DecayId = (typeof DECAYS)[number]['id']
