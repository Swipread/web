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
// Modal dialogs: only the open state and the close event matter in tests.
HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) {
  this.open = true
}
HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement, returnValue?: string) {
  if (!this.open) return
  this.open = false
  if (returnValue !== undefined) this.returnValue = returnValue
  this.dispatchEvent(new Event('close'))
}

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
