import createClient, { type Middleware } from 'openapi-fetch'
import { session } from '../lib/session'
import { networkError, toApiError } from './problem'
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
  onRequest({ request }) {
    const current = session.get()
    if (current && !isAuthEndpoint(request.url)) {
      request.headers.set('Authorization', `Bearer ${current.accessToken}`)
    }
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

export const api = createClient<paths>({
  baseUrl: API_BASE_URL,
  // Resolve fetch at call time so test interceptors and polyfills are picked up.
  fetch: (request) => globalThis.fetch(request),
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
