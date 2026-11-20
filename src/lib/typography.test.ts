import { describe, expect, it } from 'vitest'
import { frenchSpacing } from './typography'

const NBSP = ' '

describe('frenchSpacing', () => {
  it('binds guillemets and high punctuation to their words with a non-breaking space', () => {
    expect(frenchSpacing("« Ma vie, c'est le théâtre ! » : Judith Magre fête ses 100 ans")).toBe(
      `«${NBSP}Ma vie, c'est le théâtre${NBSP}!${NBSP}»${NBSP}: Judith Magre fête ses 100 ans`,
    )
    expect(frenchSpacing('Pourquoi ? Parce que ; voilà')).toBe(`Pourquoi${NBSP}? Parce que${NBSP}; voilà`)
  })

  it('changes nothing else', () => {
    expect(frenchSpacing("Une tornade s'abat sur un village")).toBe("Une tornade s'abat sur un village")
    expect(frenchSpacing('Heure: 10:30')).toBe('Heure: 10:30')
  })
})
