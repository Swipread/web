import createClient, { type Middleware } from 'openapi-fetch'
import { session } from '../lib/session'
import { networkError, toApiError } from './problem'
import { expiresSoon, refreshSession } from './refresh'
import type { paths } from './schema'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

let unauthorizedHandler: () => void = () => {}

/** Called when an authenticated request gets a 401 (missing, invalid or expired token). */
export function setUnauthorizedHandler(handler: () => void) {
  unauthorizedHandler = handler
}

// On auth endpoints a 401 means wrong credentials, not an expired session.
function isAuthEndpoint(url: string) {
  return new URL(url).pathname.startsWith('/v1/auth/')
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    if (isAuthEndpoint(request.url) || !session.get()) return request
    // Renew just before expiry: a keepalive request sent while the tab closes could not be retried.
    // On failure, go on with the current token: the 401 path below renews or ends the session.
    if (expiresSoon()) await refreshSession().catch(() => false)
    const current = session.get()
    if (current) request.headers.set('Authorization', `Bearer ${current.accessToken}`)
    return request
  },
  onResponse({ request, response }) {
    if (response.status === 401 && !isAuthEndpoint(request.url)) {
      session.clear()
      unauthorizedHandler()
    }
    return response
  },
}

/**
 * Sends the refresh token cookie to /v1/auth, and on a 401 elsewhere renews the access token once and replays
 * the request. If the refresh is refused, the 401 goes through and the middleware ends the session.
 */
async function fetchWithRefresh(request: Request): Promise<Response> {
  // Resolve fetch at call time so test interceptors and polyfills are picked up.
  if (isAuthEndpoint(request.url)) return globalThis.fetch(new Request(request, { credentials: 'include' }))
  const replay = request.clone()
  const response = await globalThis.fetch(request)
  if (response.status !== 401 || !session.get()) return response
  // A network failure while renewing propagates as a network error: the session is kept.
  const renewed = await refreshSession()
  const current = session.get()
  if (!renewed || !current) return response
  replay.headers.set('Authorization', `Bearer ${current.accessToken}`)
  return globalThis.fetch(replay)
}

export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  fetch: fetchWithRefresh,
})
api.use(authMiddleware)

type ApiResult<T> = { data?: T; error?: unknown; response: Response }

/** Resolves to the response data, or throws an ApiError. */
export async function unwrap<T>(request: Promise<ApiResult<T>>): Promise<T> {
  let result: ApiResult<T>
  try {
    result = await request
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw networkError()
  }
  if (!result.response.ok) throw toApiError(result.response.status, result.error)
  return result.data as T
}
