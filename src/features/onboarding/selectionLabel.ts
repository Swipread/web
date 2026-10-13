/** Human-readable selection count, e.g. "2 thèmes sélectionnés · encore 1 à choisir". */
export function selectionLabel(count: number, min: number) {
  const base =
    count === 0
      ? 'Aucun thème sélectionné'
      : `${count} thème${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`
  return count < min ? `${base} · encore ${min - count} à choisir` : base
}
