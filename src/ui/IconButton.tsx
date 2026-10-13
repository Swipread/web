import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './IconButton.module.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  icon: ReactNode
  /** Accessible name. Rendered as a caption under the icon when `showLabel` is true. */
  label: string
  showLabel?: boolean
  pressed?: boolean
  tone?: 'default' | 'like'
}

export function IconButton({
  icon,
  label,
  showLabel = false,
  pressed,
  tone = 'default',
  type = 'button',
  className,
  ...props
}: Props) {
  const classes = [styles.button, styles[tone], showLabel && styles.withLabel, className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={classes}
      aria-label={showLabel ? undefined : label}
      aria-pressed={pressed}
      {...props}
    >
      <span className={styles.circle}>{icon}</span>
      {showLabel && <span className={styles.caption}>{label}</span>}
    </button>
  )
}
