const WORDS_PER_MINUTE = 230

/** "6 min de lecture", or null when the word count is unknown. */
export function formatReadingTime(wordCount: number | undefined) {
  if (!wordCount || wordCount <= 0) return null
  const minutes = Math.max(1, Math.round(wordCount / WORDS_PER_MINUTE))
  return `${minutes} min de lecture`
}

const relative = new Intl.RelativeTimeFormat('fr', { numeric: 'auto', style: 'short' })
const shortDate = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short' })
const longDate = new Intl.DateTimeFormat('fr', { day: 'numeric', month: 'short', year: 'numeric' })

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

/** "À l'instant", "Il y a 2 h", "Hier", "Il y a 3 j", then "12 oct." for older dates. */
export function formatRelativeDate(iso: string | undefined, now = Date.now()) {
  if (!iso) return null
  const date = new Date(iso)
  const time = date.getTime()
  if (Number.isNaN(time)) return null
  const elapsed = now - time
  if (elapsed < MINUTE) return "À l'instant"
  if (elapsed < HOUR) return capitalize(relative.format(-Math.floor(elapsed / MINUTE), 'minute'))
  if (elapsed < DAY) return capitalize(relative.format(-Math.floor(elapsed / HOUR), 'hour'))
  if (elapsed < 7 * DAY) return capitalize(relative.format(-Math.floor(elapsed / DAY), 'day'))
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  return (sameYear ? shortDate : longDate).format(date)
}

/** "Sauvegardé hier", "Sauvegardé il y a 2 h", "Sauvegardé le 12 oct.". */
export function formatActionDate(verb: string, iso: string | undefined, now = Date.now()) {
  const relative = formatRelativeDate(iso, now)
  if (!relative) return null
  // Beyond a week formatRelativeDate gives a calendar date.
  if (now - new Date(iso!).getTime() >= 7 * DAY) return `${verb} le ${relative}`
  return `${verb} ${relative.charAt(0).toLowerCase()}${relative.slice(1)}`
}
