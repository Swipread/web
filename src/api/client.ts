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

// Endpoints that take no access token: there a 401 means wrong credentials, not an expired session.
const PUBLIC_AUTH_PATHS = new Set(['/v1/auth/register', '/v1/auth/login', '/v1/auth/refresh', '/v1/auth/logout'])

function isPublicAuthEndpoint(url: string) {
  return PUBLIC_AUTH_PATHS.has(new URL(url).pathname)
}

// The refresh token cookie is scoped to /v1/auth: send it there, including on PUT /v1/auth/password, which keeps
// the session it belongs to.
function withRefreshCookie(request: Request) {
  return new URL(request.url).pathname.startsWith('/v1/auth/') ? new Request(request, { credentials: 'include' }) : request
}

// The role travels in the access token: after a promotion, admin endpoints answer 403 until the token is renewed,
// and the renewal reads the role from the database again.
function isAdminEndpoint(url: string) {
  return new URL(url).pathname.startsWith('/v1/admin/')
}

function worthRenewing(request: Request, response: Response) {
  return response.status === 401 || (response.status === 403 && isAdminEndpoint(request.url))
}

const authMiddleware: Middleware = {
  async onRequest({ request }) {
    if (isPublicAuthEndpoint(request.url) || !session.get()) return request
    // Renew just before expiry: a keepalive request sent while the tab closes could not be retried.
    // On failure, go on with the current token: the 401 path below renews or ends the session.
    if (expiresSoon()) await refreshSession().catch(() => false)
    const current = session.get()
    if (current) request.headers.set('Authorization', `Bearer ${current.accessToken}`)
    return request
  },
  onResponse({ request, response }) {
    if (response.status === 401 && !isPublicAuthEndpoint(request.url)) {
      session.clear()
      unauthorizedHandler()
    }
    return response
  },
}

/**
 * Sends the refresh token cookie to /v1/auth, and on a 401 elsewhere (or a 403 from an admin endpoint, whose token
 * may carry a role changed since) renews the access token once and replays the request. If the refresh is refused,
 * the first response goes through: a 401 then ends the session in the middleware, a 403 stays a 403.
 */
async function fetchWithRefresh(request: Request): Promise<Response> {
  // Resolve fetch at call time so test interceptors and polyfills are picked up.
  if (isPublicAuthEndpoint(request.url)) return globalThis.fetch(withRefreshCookie(request))
  const replay = request.clone()
  const response = await globalThis.fetch(withRefreshCookie(request))
  if (!worthRenewing(request, response) || !session.get()) return response
  // A network failure while renewing propagates as a network error: the session is kept.
  const renewed = await refreshSession()
  const current = session.get()
  if (!renewed || !current) return response
  replay.headers.set('Authorization', `Bearer ${current.accessToken}`)
  return globalThis.fetch(withRefreshCookie(replay))
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
