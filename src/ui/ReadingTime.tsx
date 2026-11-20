import { formatReadingTime } from '../lib/format'

type Props = { wordCount?: number; fromSummary?: boolean }

/** « 4 min », with « de lecture » kept for screen readers; nothing when the length is unknown. */
export function ReadingTime({ wordCount, fromSummary }: Props) {
  const full = formatReadingTime(wordCount, fromSummary)
  if (!full) return null
  return (
    <>
      {full.replace(' de lecture', '')}
      <span className="visually-hidden"> de lecture</span>
    </>
  )
}
