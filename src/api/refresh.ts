import { session } from '../lib/session'
import type { Schema } from './types'

/** Renew the access token this long before it expires, so requests never leave with a stale one. */
export const RENEW_MARGIN_MS = 60_000

const LOCK_NAME = 'swipread.refresh'

let inFlight: Promise<boolean> | null = null

/**
 * Gets a new access token from the refresh token cookie (`POST /v1/auth/refresh`).
 * One call at a time in this tab; across tabs a Web Lock serializes them, and a tab that waited reuses the token
 * another tab just obtained (each refresh rotates the cookie).
 *
 * @returns false when the API refused the refresh token (expired, revoked, logged out): the reader must log in again
 * @throws when the server cannot be reached, so a network failure never ends the session
 */
export function refreshSession(): Promise<boolean> {
  inFlight ??= withLock(renew).finally(() => {
    inFlight = null
  })
  return inFlight
}

/** True when the access token is missing an expiry or expires within the renewal margin. */
export function expiresSoon(now = Date.now()) {
  const current = session.get()
  return current?.expiresAt != null && current.expiresAt - RENEW_MARGIN_MS <= now
}

async function renew(tokenBefore: string | undefined): Promise<boolean> {
  const current = session.get()
  // Another tab renewed while this one waited for the lock: its token is shared through localStorage.
  if (current && current.accessToken !== tokenBefore && !expiresSoon()) return true
  const response = await globalThis.fetch(`${import.meta.env.VITE_API_BASE_URL}/v1/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) return false
  session.save((await response.json()) as Schema<'TokenResponse'>)
  return true
}

function withLock(task: (tokenBefore: string | undefined) => Promise<boolean>) {
  const tokenBefore = session.get()?.accessToken
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined
  if (!locks) return task(tokenBefore)
  return locks.request(LOCK_NAME, () => task(tokenBefore))
}

const CHECK_INTERVAL_MS = 30_000

/**
 * Keeps the access token fresh while the app is visible, so the last events sent with keepalive when the tab
 * closes carry a valid token. Returns a cleanup function.
 */
export function startSessionRenewal() {
  const check = () => {
    if (document.visibilityState === 'visible' && session.get() && expiresSoon()) {
      // A refused refresh is handled by the next API call (401, then login page).
      refreshSession().catch(() => false)
    }
  }
  const timer = window.setInterval(check, CHECK_INTERVAL_MS)
  document.addEventListener('visibilitychange', check)
  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', check)
  }
}
