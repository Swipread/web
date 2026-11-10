import { describe, expect, it } from 'vitest'
import { feedCheckMessage } from './feedProblem'

describe('feedCheckMessage', () => {
  it.each([
    ['Feed is unreachable', 'Le flux est injoignable.'],
    ['Feed answered HTTP 404', 'Le flux a répondu par une erreur HTTP 404.'],
    ['Not a valid RSS or Atom feed', "Ce n'est pas un flux RSS ou Atom valide."],
    ['Feed has no articles', 'Le flux ne contient aucun article.'],
    [
      'Feed address is not allowed',
      'Adresse refusée : seuls les flux publics en http ou https (ports 80 et 443) sont acceptés.',
    ],
    ['Feed redirects too many times', 'Le flux redirige trop de fois.'],
    ['Feed is larger than 5 MB', 'Le flux dépasse 5 Mo.'],
  ])('translates "%s"', (detail, message) => {
    expect(feedCheckMessage(detail)).toBe(message)
  })

  it('shows an unknown detail as sent', () => {
    expect(feedCheckMessage('Feed is too large')).toBe("Le flux n'a pas pu être vérifié : Feed is too large")
  })

  it('falls back when there is no detail', () => {
    expect(feedCheckMessage(undefined)).toBe("Le flux n'a pas pu être vérifié.")
  })
})
