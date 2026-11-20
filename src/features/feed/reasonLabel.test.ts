import { describe, expect, it } from 'vitest'
import { reasonLabel } from './reasonLabel'

describe('reasonLabel', () => {
  it('explains each reason the API sends', () => {
    expect(reasonLabel('similar')).toBe('Proche de vos lectures')
    expect(reasonLabel('onboarding')).toBe("D'après vos centres d'intérêt")
    expect(reasonLabel('fallback')).toBe("D'après vos centres d'intérêt")
    expect(reasonLabel('explore')).toBe('Pour découvrir autre chose')
  })

  it('says nothing for a missing or unknown reason', () => {
    expect(reasonLabel(undefined)).toBeNull()
    expect(reasonLabel('trending')).toBeNull()
    expect(reasonLabel('toString')).toBeNull()
  })
})
