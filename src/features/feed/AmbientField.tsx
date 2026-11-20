import { hasImage } from './hasImage'
import { topicFieldClass } from '../../ui/topicField'
import type { FeedCard } from './useFeed'
import styles from './AmbientField.module.css'

type Props = {
  items: FeedCard[]
  /** Card on screen, or null before the first one is reported (the first card then sets the light). */
  activeIndex: number | null
  /** Articles whose image failed to load: they take their topic's colours. */
  failedImages: ReadonlySet<string>
}

/** Cards on each side of the current one whose layer stays mounted, so a swipe crossfades instead of popping. */
const NEIGHBOURS = 1

/**
 * The screen's light: the current article's image, blurred, saturated and veiled (or its topic's colours), behind
 * the whole feed. Each layer crossfades in when its card becomes current. The veil caps the contrast for any image.
 */
export function AmbientField({ items, activeIndex, failedImages }: Props) {
  const current = activeIndex ?? 0
  const start = Math.max(0, current - NEIGHBOURS)
  const layers = items.slice(start, current + NEIGHBOURS + 1)

  return (
    <div className={styles.field} aria-hidden="true">
      <div className={`${styles.layer} ${styles.base}`} />
      {layers.map((card, offset) => {
        const on = start + offset === current ? styles.on : ''
        return hasImage(card, failedImages) ? (
          <img
            key={card.articleId}
            src={card.imageUrl}
            alt=""
            className={`${styles.layer} ${styles.image} ${on}`}
            decoding="async"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div key={card.articleId} className={`${styles.layer} ${topicFieldClass(card.topics?.[0]?.slug)} ${on}`} />
        )
      })}
      <div className={styles.veil} />
    </div>
  )
}
