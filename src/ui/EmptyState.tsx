import type { ReactNode } from 'react'
import styles from './States.module.css'

type Props = {
  title: string
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className={styles.state}>
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}
