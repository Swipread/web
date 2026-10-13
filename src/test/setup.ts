import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { session } from '../lib/session'
import { server } from './server'

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  session.clear()
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => {
  server.close()
})
