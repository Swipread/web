import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const API_URL = 'http://api.test'

/** Full URL of an API path, for msw handlers. */
export const apiUrl = (path: string) => `${API_URL}${path}`

export const server = setupServer(...handlers)
