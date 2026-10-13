import { useState, type ReactNode } from 'react'
import styles from './ArticleRow.module.css'

type Props = {
  title: string
  url: string
  imageUrl?: string
  /** e.g. ["Le Journal Tech", "6 min de lecture"] */
  meta: string[]
  caption?: string | null
  actions?: ReactNode
  onOpen?: () => void
}

/** One article in a list (Sauvegardés, Historique): thumbnail, title linking to the source, actions. */
export function ArticleRow({ title, url, imageUrl, meta, caption, actions, onOpen }: Props) {
  const [imageFailed, setImageFailed] = useState(false)
  return (
    <article className={styles.row}>
      <div className={styles.thumb} aria-hidden="true">
        {imageUrl && !imageFailed && (
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
        {meta.length > 0 && (
          <p className={styles.meta}>
            {meta.map((part, i) => (
              <span key={i}>{part}</span>
            ))}
          </p>
        )}
        <h2 className={styles.title}>
          <a href={url} target="_blank" rel="noopener noreferrer" onClick={onOpen}>
            {title}{' '}
            <span className="visually-hidden">(nouvel onglet)</span>
          </a>
        </h2>
        {caption && <p className={styles.caption}>{caption}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </article>
  )
}
