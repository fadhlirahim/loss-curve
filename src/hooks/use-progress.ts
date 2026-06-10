import { useSyncExternalStore } from 'react'

export type ProgressState = {
  /** checklist item id → done */
  checked: Record<string, boolean>
  /** `${isoWeek}:${habitId}` → done */
  habits: Record<string, boolean>
  /** result of the "you are here" diagnostic */
  entryPhase: number | null
}

const STORAGE_KEY = 'roadmap-progress-v1'

const EMPTY: ProgressState = { checked: {}, habits: {}, entryPhase: null }

let state: ProgressState = EMPTY
let loaded = false
const listeners = new Set<() => void>()

function load(): ProgressState {
  if (loaded) return state
  loaded = true
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) }
  } catch {
    state = EMPTY
  }
  return state
}

function setState(next: ProgressState) {
  state = next
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage full or unavailable — keep in-memory state
  }
  for (const fn of listeners) fn()
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useProgress(): ProgressState {
  // Server snapshot is EMPTY so SSR HTML is deterministic; the client
  // hydrates with the same empty state, then load() pulls localStorage.
  return useSyncExternalStore(subscribe, load, () => EMPTY)
}

function toggled(record: Record<string, boolean>, key: string): Record<string, boolean> {
  const next = { ...record }
  if (next[key]) delete next[key]
  else next[key] = true
  return next
}

export function toggleItem(id: string) {
  const s = load()
  setState({ ...s, checked: toggled(s.checked, id) })
}

export function toggleHabit(isoWeek: string, habitId: string) {
  const s = load()
  setState({ ...s, habits: toggled(s.habits, `${isoWeek}:${habitId}`) })
}

export function setEntryPhase(phase: number | null) {
  setState({ ...load(), entryPhase: phase })
}

export function resetProgress() {
  setState(EMPTY)
}

/** ISO-8601 week key, e.g. "2026-W24" */
export function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}
