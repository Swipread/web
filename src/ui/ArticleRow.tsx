import { useState, type ReactNode } from 'react'
import { frenchSpacing } from '../lib/typography'
import { topicFieldClass } from './topicField'
import styles from './ArticleRow.module.css'

type Props = {
  title: string
  url: string
  imageUrl?: string
  /** First topic's slug: paints the thumbnail when there is no image. */
  topicSlug?: string
  /** What the article is: source, topic. */
  meta: (string | null | undefined)[]
  /** When it happened to the reader, and how long it reads: « Sauvegardé il y a 2 h », « 4 min ». */
  caption?: ReactNode[]
  actions?: ReactNode
  onOpen?: () => void
  /** h3 when rows sit under section headings. */
  headingLevel?: 2 | 3
}

/**
 * One article in a list (Sauvegardés, Historique). The whole row opens the article at its publisher (the title's
 * link stretches over it); the actions sit above that link.
 */
export function ArticleRow({
  title,
  url,
  imageUrl,
  topicSlug,
  meta,
  caption = [],
  actions,
  onOpen,
  headingLevel = 2,
}: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  const Heading = headingLevel === 3 ? 'h3' : 'h2'
  const metaParts = meta.filter(Boolean)
  const captionParts = caption.filter(Boolean)
  const withImage = Boolean(imageUrl) && !imageFailed
  return (
    <article className={styles.row}>
      <div className={`${styles.thumb} ${withImage ? styles.withImage : topicFieldClass(topicSlug)}`} aria-hidden="true">
        {withImage && (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            referrerPolicy="no-referrer"
            onError={() => setImageFailed(true)}
          />
        )}
      </div>
      <div className={styles.body}>
        {metaParts.length > 0 && (
          <p className={styles.meta}>
            {metaParts.map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </p>
        )}
        <Heading className={styles.title}>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={onOpen}>
            {frenchSpacing(title)}{' '}
            <span className="visually-hidden">(nouvel onglet)</span>
          </a>
        </Heading>
        {captionParts.length > 0 && (
          <p className={styles.caption}>
            {captionParts.map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </p>
        )}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
