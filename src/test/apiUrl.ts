/** Must match `test.env.VITE_API_BASE_URL` in vite.config.ts. */
export const API_URL = 'http://api.test'

/** Full URL of an API path, for msw handlers. */
export const apiUrl = (path: string) => `${API_URL}${path}`
