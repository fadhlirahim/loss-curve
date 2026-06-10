import { useEffect, useRef } from 'react'

/** Drive `fn` on a fixed tick while `active` — the run/pause animation loop. */
export function useTicker(active: boolean, fn: () => void, ms = 90) {
  const fnRef = useRef(fn)
  fnRef.current = fn
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => fnRef.current(), ms)
    return () => clearInterval(id)
  }, [active, ms])
}
