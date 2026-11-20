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

describe('selectionLabel with the profile noun', () => {
  it.each([
    [0, "Aucun centre d'intérêt sélectionné · encore 3 à choisir"],
    [1, "1 centre d'intérêt sélectionné · encore 2 à choisir"],
    [2, "2 centres d'intérêt sélectionnés · encore 1 à choisir"],
  ])('%i → %s', (count, label) => {
    expect(selectionLabel(count, 3, 'interest')).toBe(label)
  })
})
