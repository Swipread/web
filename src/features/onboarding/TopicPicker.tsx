import type { Schema } from '../../api/types'
import { Chip } from '../../ui/Chip'
import styles from './TopicPicker.module.css'

type Props = {
  topics: Schema<'TopicResponse'>[]
  selectedIds: ReadonlySet<number>
  onToggle: (id: number) => void
  align?: 'center' | 'start'
}

export function TopicPicker({ topics, selectedIds, onToggle, align = 'center' }: Props) {
  return (
    <ul className={`${styles.list} ${styles[align]}`} aria-label="Thèmes">
      {topics.map((topic) =>
        topic.id === undefined ? null : (
          <li key={topic.id}>
            <Chip selected={selectedIds.has(topic.id)} onClick={() => onToggle(topic.id!)}>
              {topic.label}
            </Chip>
          </li>
        ),
      )}
    </ul>
  )
}
