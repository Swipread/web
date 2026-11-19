import { useId } from 'react'
import { Link } from 'react-router'
import type { Schema } from '../../api/types'
import { Chip } from '../../ui/Chip'
import { SOURCE_TOPICS_MAX } from './schemas'
import styles from './SourceTopicsPicker.module.css'

type Topic = Schema<'AdminTopicResponse'>

type Props = {
  /** Topics that can be picked, in display order. */
  topics: Topic[]
  /** Picked topic ids, in order: the first is the main topic of the source's articles. */
  value: number[]
  onChange: (topicIds: number[]) => void
  error?: string
}

/**
 * Picks one to three topics in order. Each picked chip shows its rank; picking a fourth is not possible until one is
 * removed. The order matters: the source's articles inherit the topics with decreasing confidence.
 */
export function SourceTopicsPicker({ topics, value, onChange, error }: Props) {
  const labelId = useId()
  const hintId = useId()
  const errorId = useId()
  const full = value.length >= SOURCE_TOPICS_MAX
  const byId = new Map(topics.map((topic) => [topic.id, topic]))

  const toggle = (id: number) =>
    onChange(value.includes(id) ? value.filter((picked) => picked !== id) : [...value, id])

  return (
    <div className={styles.picker} role="group" aria-labelledby={labelId} aria-describedby={`${hintId}${error ? ` ${errorId}` : ''}`}>
      <span id={labelId} className={styles.label}>
        Thèmes
      </span>
      <p id={hintId} className={styles.hint}>
        1 à {SOURCE_TOPICS_MAX}, dans l'ordre : le premier est le thème principal des articles.
      </p>
      {topics.length === 0 ? (
        <p className={styles.empty}>
          Aucun thème pour l'instant. <Link to="/admin/themes">Créer les thèmes</Link>
        </p>
      ) : (
        <div className={styles.chips}>
          {topics.map((topic) => {
            if (topic.id === undefined) return null
            const rank = value.indexOf(topic.id) + 1
            return (
              <Chip
                key={topic.id}
                selected={rank > 0}
                marker={
                  <span className={styles.rank} aria-hidden="true">
                    {rank}
                  </span>
                }
                aria-label={rank > 0 ? `${topic.label}, thème ${rank}` : topic.label}
                disabled={rank === 0 && full}
                onClick={() => toggle(topic.id!)}
              >
                {topic.label}
              </Chip>
            )
          })}
        </div>
      )}
      {value.length > 0 && (
        <p className={styles.order} aria-live="polite">
          {value.map((id, index) => `${index + 1}. ${byId.get(id)?.label ?? `Thème ${id}`}`).join(' · ')}
        </p>
      )}
      {error && (
        <p id={errorId} className={styles.error}>
          {error}
        </p>
      )}
    </div>
  )
}
