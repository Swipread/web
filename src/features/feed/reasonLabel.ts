/**
 * Why an article is in the feed, from the item's `reason`. `onboarding` and `fallback` both come from the topics
 * the reader picked; an unknown reason shows nothing rather than a guess.
 */
const LABELS: Record<string, string> = {
  similar: 'Proche de vos lectures',
  onboarding: "D'après vos centres d'intérêt",
  fallback: "D'après vos centres d'intérêt",
  explore: 'Pour découvrir autre chose',
}

export function reasonLabel(reason: string | undefined) {
  return reason && Object.hasOwn(LABELS, reason) ? LABELS[reason] : null
}
