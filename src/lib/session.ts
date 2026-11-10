import type { Schema } from '../api/types'

export type Session = {
  accessToken: string
  userId: string
  /** Epoch ms after which the access token expires, or null if unknown. It is then renewed, not dropped. */
  expiresAt: number | null
}

const STORAGE_KEY = 'swipread.session'
const listeners = new Set<() => void>()
// Cached so useSyncExternalStore gets a stable snapshot; undefined = not read yet.
let cached: Session | null | undefined

function readStorage(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Session) : null
  } catch {
    return null
  }
}

function notify() {
  listeners.forEach((listener) => listener())
}

export const session = {
  /** The session outlives its access token: the refresh token cookie renews it (see api/refresh.ts). */
  get(): Session | null {
    if (cached === undefined) cached = readStorage()
    return cached
  },

  save(token: Schema<'TokenResponse'>) {
    if (!token.accessToken || !token.userId) throw new Error('Token response is missing accessToken or userId')
    // expiresIn is assumed to be in seconds (OAuth2 convention).
    const expiresAt = token.expiresIn ? Date.now() + token.expiresIn * 1000 : null
    cached = { accessToken: token.accessToken, userId: token.userId, expiresAt }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cached))
    } catch {
      // Storage unavailable (private mode): session lives in memory only.
    }
    notify()
  },

  clear() {
    const hadSession = cached !== null
    cached = null
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    if (hadSession) notify()
  },

  subscribe(listener: () => void) {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

// Keep tabs in sync: logging out in one tab logs out the others.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return
    cached = undefined
    notify()
  })
}
