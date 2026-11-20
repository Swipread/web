import type { ReactNode } from 'react'
import { formatReadingTime, formatRelativeDate } from '../../lib/format'
import { frenchSpacing } from '../../lib/typography'
import { ReadingTime } from '../../ui/ReadingTime'
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

/** One article over the ambient field: photo, source, title, summary, why it is here, actions, then reading. */
export function ArticleCard({
  card,
  titleId,
  withImage,
  current,
  eager = false,
  actions,
  onImageError,
  onOpen,
}: Props) {
  // Topics come most confident first; the list may be empty.
  const topic = card.topics?.[0]?.label
  const meta = [
    [card.sourceName, topic],
    [
      formatRelativeDate(card.publishedAt),
      formatReadingTime(card.wordCount, card.wordCountFromSummary) && (
        <ReadingTime wordCount={card.wordCount} fromSummary={card.wordCountFromSummary} />
      ),
    ],
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
        {frenchSpacing(card.title ?? '')}
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
