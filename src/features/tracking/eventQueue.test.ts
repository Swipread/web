import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../api/problem'
import { createEventQueue, type SendBatch, type TrackInput } from './eventQueue'
import { startTracking } from './tracker'

const event: TrackInput = { type: 'impression', articleId: 'a_1', requestId: 'r_1', position: 0 }

describe('event queue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('sends queued events every 5 seconds with a client-side id and timestamp', async () => {
    const send = vi.fn<SendBatch>().mockResolvedValue()
    const queue = createEventQueue(send)
    const trackedAt = new Date().toISOString()

    queue.track(event)
    queue.track({ ...event, type: 'view', payload: { dwellMs: 4200 } })
    await vi.advanceTimersByTimeAsync(4_999)
    expect(send).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1)
    expect(send).toHaveBeenCalledOnce()
    const [events, options] = send.mock.calls[0]
    expect(options).toEqual({ keepalive: false })
    expect(events).toHaveLength(2)
    expect(events[0]).toMatchObject({ ...event, eventId: expect.stringMatching(/^e_/) })
    expect(events[0].occurredAt).toBe(trackedAt)
    expect(events[0].eventId).not.toBe(events[1].eventId)
    expect(queue.size).toBe(0)
  })

  it('sends right away once 20 events are queued', () => {
    const send = vi.fn<SendBatch>().mockResolvedValue()
    const queue = createEventQueue(send)

    for (let i = 0; i < 19; i++) queue.track(event)
    expect(send).not.toHaveBeenCalled()
    queue.track(event)
    expect(send).toHaveBeenCalledOnce()
    expect(send.mock.calls[0][0]).toHaveLength(20)
  })

  it('keeps events after a network or server error and splits big batches', async () => {
    const send = vi.fn<SendBatch>().mockRejectedValue(new ApiError(503, 'down'))
    const queue = createEventQueue(send)

    for (let i = 0; i < 120; i++) queue.track(event)
    await vi.advanceTimersByTimeAsync(0)
    expect(queue.size).toBe(120)

    send.mockReset().mockResolvedValue()
    await queue.flush()
    expect(send.mock.calls.map(([events]) => events.length)).toEqual([100, 20])
    expect(queue.size).toBe(0)
  })

  it('drops a batch the server rejects as invalid', async () => {
    const send = vi.fn<SendBatch>().mockRejectedValue(new ApiError(400, 'invalid'))
    const queue = createEventQueue(send)

    queue.track(event)
    await queue.flush()
    expect(queue.size).toBe(0)
  })

  it('flushes with keepalive when the tab is hidden, and finalizes on close', async () => {
    const send = vi.fn<SendBatch>().mockResolvedValue()
    const queue = createEventQueue(send)
    const finalize = vi.fn(() => queue.track({ ...event, type: 'view', payload: { dwellMs: 900 } }))
    queue.onExit(finalize)
    const stop = startTracking(queue)

    queue.track(event)
    vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    document.dispatchEvent(new Event('visibilitychange'))
    expect(send).toHaveBeenLastCalledWith([expect.objectContaining({ type: 'impression' })], { keepalive: true })
    expect(finalize).not.toHaveBeenCalled()

    window.dispatchEvent(new Event('pagehide'))
    expect(finalize).toHaveBeenCalledOnce()
    expect(send).toHaveBeenLastCalledWith([expect.objectContaining({ type: 'view' })], { keepalive: true })
    stop()
  })
})
