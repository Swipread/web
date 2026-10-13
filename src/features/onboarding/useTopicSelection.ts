import { useState } from 'react'

/** Selected topic ids; `initial` seeds the selection until the user changes it. */
export function useTopicSelection(initial: number[] | undefined) {
  const [touched, setTouched] = useState<Set<number> | null>(null)
  const selected = touched ?? new Set(initial ?? [])

  const toggle = (id: number) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setTouched(next)
  }

  const reset = () => setTouched(null)

  return { selected, toggle, reset, isDirty: touched !== null }
}
