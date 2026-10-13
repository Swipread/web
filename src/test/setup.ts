import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import { tracker } from '../features/tracking/tracker'
import { session } from '../lib/session'
import { MockIntersectionObserver } from './intersectionObserver'
import { server } from './server'

// Browser APIs missing from jsdom.
vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)
Element.prototype.scrollIntoView = function scrollIntoView() {}

beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' })
})

afterEach(() => {
  cleanup()
  server.resetHandlers()
  tracker.clear()
  session.clear()
  localStorage.clear()
  sessionStorage.clear()
})

afterAll(() => {
  server.close()
})
