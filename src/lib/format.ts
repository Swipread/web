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

export type RecencyGroup = 'today' | 'week' | 'older'

function startOfDay(time: number) {
  const date = new Date(time)
  date.setHours(0, 0, 0, 0)
  return date.getTime()
}

/** Calendar days between `iso` and `now`, in local time: 0 for today, 1 for yesterday. */
function daysAgo(iso: string, now: number) {
  const date = new Date(iso)
  const today = new Date(startOfDay(now))
  // Count calendar days rather than 24 h spans, so DST changes do not shift the result.
  const day = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.round((today.getTime() - day.getTime()) / DAY)
}

/** "Aujourd'hui" (today), "Cette semaine" (the 6 previous days) or older. */
export function recencyGroup(iso: string | undefined, now = Date.now()): RecencyGroup {
  if (!iso || Number.isNaN(new Date(iso).getTime())) return 'older'
  const days = daysAgo(iso, now)
  if (days <= 0) return 'today'
  return days < 7 ? 'week' : 'older'
}

const weekday = new Intl.DateTimeFormat('fr', { weekday: 'long' })
const NBSP = ' '

/** "Lu à 10 h 12" today, "Lu hier", "Lu lundi" within the week, then "Lu le 12 oct.". */
export function formatReadAt(iso: string | undefined, now = Date.now()) {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const days = daysAgo(iso, now)
  if (days <= 0) {
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `Lu à ${date.getHours()}${NBSP}h${NBSP}${minutes}`
  }
  if (days === 1) return 'Lu hier'
  if (days < 7) return `Lu ${weekday.format(date)}`
  const sameYear = date.getFullYear() === new Date(now).getFullYear()
  return `Lu le ${(sameYear ? shortDate : longDate).format(date)}`
}

const count = new Intl.NumberFormat('fr')

/** "1 284" with the French thousands separator. */
export function formatCount(value: number | undefined) {
  return count.format(value ?? 0)
}
