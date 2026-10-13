function matches(query: string) {
  return typeof window !== 'undefined' && (window.matchMedia?.(query).matches ?? false)
}

/** `X-Device` header value expected by the API. */
export function getDevice(): 'mobile' | 'desktop' {
  return matches('(max-width: 768px), (pointer: coarse)') ? 'mobile' : 'desktop'
}

export function prefersReducedMotion() {
  return matches('(prefers-reduced-motion: reduce)')
}
