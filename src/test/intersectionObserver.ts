import { act } from '@testing-library/react'

/** Controllable IntersectionObserver for jsdom, which has none. */
export class MockIntersectionObserver implements IntersectionObserver {
  static instances = new Set<MockIntersectionObserver>()
  readonly root: Element | Document | null
  readonly rootMargin = '0px'
  readonly scrollMargin = '0px'
  readonly thresholds: readonly number[]
  readonly elements = new Set<Element>()
  private readonly callback: IntersectionObserverCallback

  constructor(callback: IntersectionObserverCallback, options: IntersectionObserverInit = {}) {
    this.callback = callback
    this.root = options.root ?? null
    this.thresholds = [options.threshold ?? 0].flat()
    MockIntersectionObserver.instances.add(this)
  }

  observe(element: Element) {
    this.elements.add(element)
  }

  unobserve(element: Element) {
    this.elements.delete(element)
  }

  disconnect() {
    this.elements.clear()
    MockIntersectionObserver.instances.delete(this)
  }

  takeRecords(): IntersectionObserverEntry[] {
    return []
  }

  trigger(element: Element, isIntersecting: boolean) {
    const rect = element.getBoundingClientRect()
    this.callback(
      [
        {
          target: element,
          isIntersecting,
          intersectionRatio: isIntersecting ? 1 : 0,
          boundingClientRect: rect,
          intersectionRect: rect,
          rootBounds: null,
          time: performance.now(),
        },
      ],
      this,
    )
  }
}

/** Simulates `element` entering (or leaving) the viewport of every observer watching it. */
export function setVisible(element: Element, isIntersecting = true) {
  act(() => {
    for (const observer of MockIntersectionObserver.instances) {
      if (observer.elements.has(element)) observer.trigger(element, isIntersecting)
    }
  })
}
