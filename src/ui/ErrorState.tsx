import { Button } from './Button'
import styles from './States.module.css'

type Props = {
  message: string
  onRetry?: () => void
  retrying?: boolean
}

export function ErrorState({ message, onRetry, retrying = false }: Props) {
  return (
    <div className={styles.state} role="alert">
      <p className={styles.title}>Une erreur est survenue</p>
      <p className={styles.description}>{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} loading={retrying}>
          Réessayer
        </Button>
      )}
    </div>
  )
}
