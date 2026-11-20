import type { ReactNode } from 'react'
import { formatReadingTime, formatRelativeDate } from '../../lib/format'
import { reasonLabel } from './reasonLabel'
import type { FeedCard } from './useFeed'
import styles from './ArticleCard.module.css'

type Props = {
  card: FeedCard
  titleId: string
  /** Shows its photo; false when the article has none or it failed to load. */
  withImage: boolean
  /** The card on screen: its photo settles in. */
  current: boolean
  /** First card loads its image eagerly. */
  eager?: boolean
  /** The reactions row, placed between the text and the reading link. */
  actions: ReactNode
  onImageError: () => void
  onOpen?: () => void
}

/** « 4 min », with « de lecture » kept for screen readers: the short form keeps the meta line on one line. */
function readingTime(card: FeedCard) {
  const full = formatReadingTime(card.wordCount, card.wordCountFromSummary)
  if (!full) return null
  return (
    <>
      {full.replace(' de lecture', '')}
      <span className="visually-hidden"> de lecture</span>
    </>
  )
}

/** One article over the ambient field: photo, source, title, summary, why it is here, actions, then reading. */
export function ArticleCard({ card, titleId, withImage, current, eager = false, actions, onImageError, onOpen }: Props) {
  // Topics come most confident first; the list may be empty.
  const topic = card.topics?.[0]?.label
  const meta = [
    [card.sourceName, topic],
    [formatRelativeDate(card.publishedAt), readingTime(card)],
  ]
    .map((group) => group.filter(Boolean))
    .filter((group) => group.length > 0)
  const reason = reasonLabel(card.reason)

  return (
    <div className={`${styles.card} ${withImage ? '' : styles.noImage}`} data-current={current || undefined}>
      {withImage && (
        <img
          src={card.imageUrl}
          alt=""
          className={styles.photo}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          onError={onImageError}
        />
      )}
      {meta.length > 0 && (
        <p className={styles.meta}>
          {meta.map((group, i) => (
            <span key={i}>
              {group.map((part, j) => (
                <span key={j}>{part}</span>
              ))}
            </span>
          ))}
        </p>
      )}
      <h2 id={titleId} className={styles.title}>
        {card.title}
      </h2>
      {card.summary && <p className={styles.summary}>{card.summary}</p>}
      {reason && <p className={styles.reason}>{reason}</p>}
      <div className={styles.bottom}>
        {actions}
        {card.url && (
          <a href={card.url} target="_blank" rel="noopener noreferrer" className={styles.read} onClick={onOpen}>
            {card.sourceName ? `Lire l'article chez ${card.sourceName}` : "Lire l'article"}{' '}
            <span className="visually-hidden">(nouvel onglet)</span>
          </a>
        )}
      </div>
    </div>
  )
}
