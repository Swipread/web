import { Spinner } from './Spinner'
import styles from './States.module.css'

export function LoadingState({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className={styles.state}>
      <Spinner label={label} />
    </div>
  )
}
