import { describe, expect, it } from 'vitest'
import { selectionLabel } from './selectionLabel'

describe('selectionLabel', () => {
  it.each([
    [0, 'Aucun thème sélectionné · encore 3 à choisir'],
    [1, '1 thème sélectionné · encore 2 à choisir'],
    [3, '3 thèmes sélectionnés'],
    [5, '5 thèmes sélectionnés'],
  ])('%i → %s', (count, label) => {
    expect(selectionLabel(count, 3)).toBe(label)
  })
})
