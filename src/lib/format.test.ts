import { describe, expect, it } from 'vitest'
import { formatActionDate, formatReadAt, formatReadingTime, formatRelativeDate, recencyGroup } from './format'

describe('formatReadingTime', () => {
  it.each([
    [undefined, null],
    [0, null],
    [50, '1 min de lecture'],
    [1380, '6 min de lecture'],
  ])('%s words → %s', (words, label) => {
    expect(formatReadingTime(words)).toBe(label)
  })
})

describe('formatRelativeDate', () => {
  const now = new Date('2026-10-13T12:00:00Z').getTime()

  it.each([
    ['2026-10-13T11:59:30Z', "À l'instant"],
    ['2026-10-13T11:45:00Z', 'Il y a 15 min'],
    ['2026-10-13T10:00:00Z', 'Il y a 2 h'],
    ['2026-10-12T10:00:00Z', 'Hier'],
    ['2026-10-10T12:00:00Z', 'Il y a 3 j'],
    ['2026-09-01T12:00:00Z', '1 sept.'],
    ['2025-09-01T12:00:00Z', '1 sept. 2025'],
  ])('%s → %s', (iso, label) => {
    // Intl uses non-breaking spaces, as French typography requires.
    expect(formatRelativeDate(iso, now)?.replace(/\s/g, ' ')).toBe(label)
  })

  it('ignores missing or invalid dates', () => {
    expect(formatRelativeDate(undefined, now)).toBeNull()
    expect(formatRelativeDate('nope', now)).toBeNull()
  })
})

describe('formatActionDate', () => {
  const now = new Date('2026-10-13T12:00:00Z').getTime()
  const normalize = (text: string | null) => text?.replace(/\s/g, ' ')

  it.each([
    ['2026-10-13T10:00:00Z', 'Sauvegardé il y a 2 h'],
    ['2026-10-12T10:00:00Z', 'Sauvegardé hier'],
    ['2026-09-01T12:00:00Z', 'Sauvegardé le 1 sept.'],
    ['2025-09-01T12:00:00Z', 'Sauvegardé le 1 sept. 2025'],
  ])('%s → %s', (iso, label) => {
    expect(normalize(formatActionDate('Sauvegardé', iso, now))).toBe(label)
  })
})

describe('history dates', () => {
  // Tuesday 13 October 2026, 15:30 local time.
  const now = new Date(2026, 9, 13, 15, 30).getTime()
  const at = (...args: [number, number, number, number?, number?]) => new Date(...args).toISOString()

  it.each([
    [at(2026, 9, 13, 0, 5), 'today'],
    [at(2026, 9, 12, 23, 59), 'week'],
    [at(2026, 9, 7, 8, 0), 'week'],
    [at(2026, 9, 6, 23, 0), 'older'],
    [undefined, 'older'],
  ])('%s is in group %s', (iso, group) => {
    expect(recencyGroup(iso, now)).toBe(group)
  })

  it.each([
    [at(2026, 9, 13, 10, 12), 'Lu à 10 h 12'],
    [at(2026, 9, 13, 9, 5), 'Lu à 9 h 05'],
    [at(2026, 9, 12, 22, 0), 'Lu hier'],
    [at(2026, 9, 11, 8, 0), 'Lu dimanche'],
    [at(2026, 9, 1, 8, 0), 'Lu le 1 oct.'],
    [at(2025, 11, 24, 8, 0), 'Lu le 24 déc. 2025'],
  ])('%s → %s', (iso, label) => {
    expect(formatReadAt(iso, now)).toBe(label)
  })
})
