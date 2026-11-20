import type { Schema } from '../../api/types'
import { CheckIcon } from '../../ui/icons'
import { hasTopicColours, topicFieldClass } from '../../ui/topicField'
import styles from './TopicPicker.module.css'

type Props = {
  topics: Schema<'TopicResponse'>[]
  selectedIds: ReadonlySet<number>
  onToggle: (id: number) => void
}

/**
 * The topics as tiles. A chosen tile lights up with its topic's gradient, the colours the feed uses for that topic's
 * articles without an image; an unchosen one shows them as a small swatch. A topic without colours of its own is
 * chosen in ink instead, as every other selection in the app, since the neutral gradient would not read as lit.
 */
export function TopicPicker({ topics, selectedIds, onToggle }: Props) {
  return (
    <ul className={styles.grid} aria-label="Thèmes">
      {topics.map((topic) => {
        if (topic.id === undefined) return null
        const id = topic.id
        const selected = selectedIds.has(id)
        const field = topicFieldClass(topic.slug)
        const neutral = !hasTopicColours(topic.slug)
        return (
          <li key={id}>
            <button
              type="button"
              aria-pressed={selected}
              className={`${styles.tile} ${neutral ? styles.neutral : ''}`}
              onClick={() => onToggle(id)}
            >
              <span className={`${styles.light} ${field}`} aria-hidden="true" />
              <span className={styles.top} aria-hidden="true">
                {selected ? (
                  <CheckIcon size={18} strokeWidth={2.5} />
                ) : (
                  <span className={`${styles.swatch} ${field}`} />
                )}
              </span>
              <span className={styles.label}>{topic.label}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
