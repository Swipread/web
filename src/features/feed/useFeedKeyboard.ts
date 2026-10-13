import { useEffect } from 'react'

const NEXT_KEYS = new Set(['ArrowDown', 'PageDown'])
const PREVIOUS_KEYS = new Set(['ArrowUp', 'PageUp'])

function isEditable(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
}

/** ↑/↓ (and Page Up/Down) move between cards while the feed is on screen. */
export function useFeedKeyboard(onNext: () => void, onPrevious: () => void) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
      if (isEditable(event.target)) return
      if (NEXT_KEYS.has(event.key)) {
        event.preventDefault()
        onNext()
      } else if (PREVIOUS_KEYS.has(event.key)) {
        event.preventDefault()
        onPrevious()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onNext, onPrevious])
}
