import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export { apiUrl } from './apiUrl'

export const server = setupServer(...handlers)
