import { useCallback, useEffect, useRef } from 'react'
import type { FeedCard } from '../feed/useFeed'
import type { EventType } from './eventQueue'
import { tracker } from './tracker'

type CardRef = { card: FeedCard; index: number }
type View = CardRef & { visibleMs: number; visibleSince: number | null }
type PendingRead = CardRef & { hiddenAt: number | null }

function eventBase({ card, index }: CardRef) {
  return { articleId: card.articleId, requestId: card.requestId, position: card.position ?? index }
}

const isVisible = () => document.visibilityState === 'visible'

/**
 * Feed events from the contract:
 * - `impression` when a card becomes the current one (once per card),
 * - `view` with `dwellMs` when it stops being current; time with the tab hidden is not counted,
 * - `open`, then `read` with `readMs` when the reader comes back from the article's tab.
 *   `scrollDepth` cannot be measured on the source's site, so it is not sent.
 */
export function useFeedTracking(items: FeedCard[], activeIndex: number | null) {
  const impressed = useRef(new Set<string>())
  const view = useRef<View | null>(null)
  const pendingRead = useRef<PendingRead | null>(null)

  const endView = useCallback(() => {
    const current = view.current
    if (!current) return
    const running = current.visibleSince === null ? 0 : performance.now() - current.visibleSince
    tracker.track({ type: 'view', ...eventBase(current), payload: { dwellMs: Math.round(current.visibleMs + running) } })
    view.current = null
  }, [])

  // A new current card: close the previous view, open a new one. Also covers a hidden card
  // being replaced by the next one at the same index.
  useEffect(() => {
    if (activeIndex === null) return
    const card = items[activeIndex]
    if (view.current?.card.articleId === card?.articleId) return
    endView()
    if (!card) return
    view.current = { card, index: activeIndex, visibleMs: 0, visibleSince: isVisible() ? performance.now() : null }
    if (!impressed.current.has(card.articleId)) {
      impressed.current.add(card.articleId)
      tracker.track({ type: 'impression', ...eventBase(view.current) })
    }
  }, [activeIndex, items, endView])

  useEffect(() => {
    const onVisibilityChange = () => {
      const now = performance.now()
      const current = view.current
      if (!isVisible()) {
        if (current && current.visibleSince !== null) {
          current.visibleMs += now - current.visibleSince
          current.visibleSince = null
        }
        if (pendingRead.current) pendingRead.current.hiddenAt ??= now
        return
      }
      if (current) current.visibleSince = now
      const read = pendingRead.current
      if (read?.hiddenAt != null) {
        tracker.track({ type: 'read', ...eventBase(read), payload: { readMs: Math.round(now - read.hiddenAt) } })
        pendingRead.current = null
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    const stopExit = tracker.onExit(endView)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      stopExit()
      // Leaving the feed page ends the current view.
      endView()
    }
  }, [endView])

  const trackAction = useCallback(
    (type: Extract<EventType, 'like' | 'unlike' | 'save' | 'share' | 'hide'>, card: FeedCard, index: number, payload?: Record<string, unknown>) => {
      tracker.track({ type, ...eventBase({ card, index }), payload })
    },
    [],
  )

  const trackOpen = useCallback((card: FeedCard, index: number) => {
    tracker.track({ type: 'open', ...eventBase({ card, index }) })
    pendingRead.current = { card, index, hiddenAt: null }
  }, [])

  return { trackAction, trackOpen }
}
