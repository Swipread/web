// 422 details documented for POST /v1/admin/sources (API repository: docs/api.md). They are in English:
// known ones are translated, any other one is shown as sent.
const KNOWN_DETAILS: [RegExp, (match: RegExpMatchArray) => string][] = [
  [/^Feed is unreachable$/i, () => 'Le flux est injoignable.'],
  [/^Feed answered HTTP (\d+)$/i, ([, status]) => `Le flux a répondu par une erreur HTTP ${status}.`],
  [/^Not a valid RSS or Atom feed$/i, () => "Ce n'est pas un flux RSS ou Atom valide."],
  [/^Feed has no articles$/i, () => 'Le flux ne contient aucun article.'],
  [
    /^Feed address is not allowed$/i,
    () => 'Adresse refusée : seuls les flux publics en http ou https (ports 80 et 443) sont acceptés.',
  ],
  [/^Feed redirects too many times$/i, () => 'Le flux redirige trop de fois.'],
  [/^Feed is larger than (\d+) MB$/i, ([, size]) => `Le flux dépasse ${size} Mo.`],
]

/** Message shown under the feed URL when the API could not validate the feed. */
export function feedCheckMessage(detail: string | undefined) {
  const text = detail?.trim()
  if (!text) return "Le flux n'a pas pu être vérifié."
  for (const [pattern, translate] of KNOWN_DETAILS) {
    const match = text.match(pattern)
    if (match) return translate(match)
  }
  return `Le flux n'a pas pu être vérifié : ${text}`
}
