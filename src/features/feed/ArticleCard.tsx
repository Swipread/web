import { useState } from 'react'
import { formatReadingTime, formatRelativeDate } from '../../lib/format'
import type { FeedCard } from './useFeed'
import styles from './ArticleCard.module.css'

type Props = {
  card: FeedCard
  titleId: string
  /** First card loads its image eagerly. */
  eager?: boolean
  onOpen?: () => void
}

export function ArticleCard({ card, titleId, eager = false, onOpen }: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  const meta = [card.sourceName, formatRelativeDate(card.publishedAt), formatReadingTime(card.wordCount)].filter(
    Boolean,
  )

  return (
    <div className={styles.card}>
      <div className={styles.media}>
        {card.imageUrl && !imageFailed ? (
          <img
            src={card.imageUrl}
            alt=""
            className={styles.image}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <span className={styles.placeholder} aria-hidden="true">
            {card.sourceName?.charAt(0)}
          </span>
        )}
      </div>
      <div className={styles.body}>
        {meta.length > 0 && (
          <p className={styles.meta}>
            {meta.map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </p>
        )}
        <h2 id={titleId} className={styles.title}>
          {card.title}
        </h2>
        {card.summary && <p className={styles.summary}>{card.summary}</p>}
        {card.url && (
          <a
            href={card.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.read}
            onClick={onOpen}
          >
            Lire l'article{' '}
            <span className="visually-hidden">(nouvel onglet)</span>
          </a>
        )}
      </div>
    </div>
  )
}
