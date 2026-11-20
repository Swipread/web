/** How a page names what the reader picks: the onboarding counts « thèmes », the profile « centres d'intérêt ». */
export type SelectionNoun = 'topic' | 'interest'

const NOUNS: Record<SelectionNoun, { one: string; many: string }> = {
  topic: { one: 'thème', many: 'thèmes' },
  interest: { one: "centre d'intérêt", many: "centres d'intérêt" },
}

/** Human-readable selection count, e.g. "2 thèmes sélectionnés · encore 1 à choisir". */
export function selectionLabel(count: number, min: number, noun: SelectionNoun = 'topic') {
  const { one, many } = NOUNS[noun]
  const base =
    count === 0
      ? `Aucun ${one} sélectionné`
      : `${count} ${count > 1 ? many : one} sélectionné${count > 1 ? 's' : ''}`
  return count < min ? `${base} · encore ${min - count} à choisir` : base
}
