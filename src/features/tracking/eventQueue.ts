import { ApiError } from '../../api/problem'
import type { Schema } from '../../api/types'
import { newId } from '../../lib/ids'

/** Event types allowed by `EventRequest.type` (see the backend / reco contract). */
export type EventType = 'impression' | 'view' | 'open' | 'read' | 'like' | 'unlike' | 'save' | 'unsave' | 'share' | 'hide'

export type TrackedEvent = Schema<'EventRequest'> & { type: EventType }
export type TrackInput = Omit<TrackedEvent, 'eventId' | 'occurredAt'>
export type SendBatch = (events: TrackedEvent[], options: { keepalive: boolean }) => Promise<void>

export const FLUSH_INTERVAL_MS = 5_000
export const FLUSH_THRESHOLD = 20
/** `EventBatchRequest.events` accepts at most 100 events. */
export const MAX_BATCH_SIZE = 100
/** Oldest events are dropped beyond this, e.g. while the server is down. */
export const MAX_QUEUE_SIZE = 500

// Resending is safe: the backend deduplicates on eventId.
function isRetryable(error: unknown) {
  if (!(error instanceof ApiError)) return true
  return error.status === 0 || error.status === 429 || error.status >= 500
}

/**
 * Buffers events and sends them in batches: every 5 s, as soon as 20 are queued,
 * or on demand (tab hidden, logout).
 */
export function createEventQueue(send: SendBatch) {
  let queue: TrackedEvent[] = []
  let timer: ReturnType<typeof setTimeout> | null = null
  const finalizers = new Set<() => void>()

  function cancelTimer() {
    if (timer !== null) clearTimeout(timer)
    timer = null
  }

  function schedule() {
    timer ??= setTimeout(() => {
      timer = null
      void flush()
    }, FLUSH_INTERVAL_MS)
  }

  function track(input: TrackInput) {
    queue.push({ ...input, eventId: newId('e'), occurredAt: new Date().toISOString() })
    if (queue.length > MAX_QUEUE_SIZE) queue = queue.slice(-MAX_QUEUE_SIZE)
    if (queue.length >= FLUSH_THRESHOLD) void flush()
    else schedule()
  }

  async function flush({ keepalive = false } = {}) {
    cancelTimer()
    const batches: TrackedEvent[][] = []
    while (queue.length > 0) batches.push(queue.splice(0, MAX_BATCH_SIZE))
    await Promise.all(
      batches.map(async (batch) => {
        try {
          await send(batch, { keepalive })
        } catch (error) {
          if (!isRetryable(error)) return
          queue.unshift(...batch)
          schedule()
        }
      }),
    )
  }

  /** Last chance before the page goes away: let finalizers record pending events, then send everything. */
  function flushOnExit() {
    finalizers.forEach((finalize) => finalize())
    return flush({ keepalive: true })
  }

  /** Registers a callback run just before the final flush (e.g. to close an open `view`). */
  function onExit(finalize: () => void) {
    finalizers.add(finalize)
    return () => {
      finalizers.delete(finalize)
    }
  }

  function clear() {
    cancelTimer()
    queue = []
  }

  return {
    track,
    flush,
    flushOnExit,
    onExit,
    clear,
    get size() {
      return queue.length
    },
  }
}

export type EventQueue = ReturnType<typeof createEventQueue>
