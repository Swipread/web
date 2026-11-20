const NBSP = ' '

/**
 * French typographic spacing for display: the space inside « » and before : ; ! ? becomes non-breaking, so a guillemet
 * or a colon never starts or ends a line on its own. A full non-breaking space rather than the narrow one (U+202F),
 * which Schibsted Grotesk draws almost without width. Only whitespace changes, never the words: a publisher's title
 * stays the publisher's.
 */
export function frenchSpacing(text: string) {
  return text
    .replace(/«\s+/g, `«${NBSP}`)
    .replace(/\s+»/g, `${NBSP}»`)
    .replace(/\s+([:;!?])/g, `${NBSP}$1`)
}
