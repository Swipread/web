import styles from './Spinner.module.css'

type Props = {
  size?: 'sm' | 'md'
  /** Announced to screen readers; pass null when the parent already conveys the busy state. */
  label?: string | null
}

export function Spinner({ size = 'md', label = 'Chargement…' }: Props) {
  const spinner = <span className={`${styles.spinner} ${styles[size]}`} aria-hidden="true" />
  if (label === null) return spinner
  return (
    <span role="status" className={styles.wrapper}>
      {spinner}
      <span className="visually-hidden">{label}</span>
    </span>
  )
}
