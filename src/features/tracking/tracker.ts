import { api, unwrap } from '../../api/client'
import { getSessionId } from '../../lib/ids'
import { session } from '../../lib/session'
import { createEventQueue, type EventQueue, type SendBatch } from './eventQueue'

const sendBatch: SendBatch = async (events, { keepalive }) => {
  // Read the token now: on logout the session is cleared right after the flush starts.
  const current = session.get()
  if (!current) return
  await unwrap(
    api.POST('/v1/events', {
      body: { sessionId: getSessionId(), events },
      headers: { Authorization: `Bearer ${current.accessToken}` },
      // Survives the tab closing, like sendBeacon, but keeps the Authorization header.
      keepalive,
    }),
  )
}

/** App-wide event queue. Always go through it, never call /v1/events directly. */
export const tracker = createEventQueue(sendBatch)

/**
 * Sends pending events when the tab is hidden (it may never come back) and when it is closed.
 * Only closing runs the exit finalizers: hiding also happens when the reader opens an article,
 * and the current card's `view` must keep running meanwhile. Returns a cleanup function.
 */
export function startTracking(queue: EventQueue = tracker) {
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') void queue.flush({ keepalive: true })
  }
  const onPageHide = () => void queue.flushOnExit()
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('pagehide', onPageHide)
  return () => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('pagehide', onPageHide)
  }
}
