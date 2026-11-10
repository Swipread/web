import { afterEach, describe, expect, it, vi } from 'vitest'
import { session } from './session'

describe('session', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('persists the token and notifies subscribers', () => {
    const listener = vi.fn()
    const unsubscribe = session.subscribe(listener)
    session.save({ accessToken: 'jwt', userId: 'u_1', expiresIn: 3600 })

    expect(session.get()).toMatchObject({ accessToken: 'jwt', userId: 'u_1' })
    expect(JSON.parse(localStorage.getItem('swipread.session')!)).toMatchObject({ accessToken: 'jwt' })
    expect(listener).toHaveBeenCalledOnce()
    unsubscribe()
  })

  it('keeps the session when the access token expires: the refresh token renews it', () => {
    vi.useFakeTimers()
    session.save({ accessToken: 'jwt', userId: 'u_1', expiresIn: 60 })
    vi.advanceTimersByTime(61_000)

    expect(session.get()).toMatchObject({ accessToken: 'jwt', userId: 'u_1' })
  })

  it('clears the session', () => {
    session.save({ accessToken: 'jwt', userId: 'u_1', expiresIn: 3600 })
    session.clear()
    expect(session.get()).toBeNull()
  })
})
