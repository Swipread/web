import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './IconButton.module.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'children'> & {
  icon: ReactNode
  /** Accessible name. Rendered as a caption under the icon when `showLabel` is true. */
  label: string
  showLabel?: boolean
  pressed?: boolean
  tone?: 'default' | 'like'
  /** `ambient`: larger translucent circle drawn over an article's ambient field (feed). */
  variant?: 'default' | 'ambient'
  /** `sm`: a 40px circle, for rows of a list. */
  size?: 'md' | 'sm'
}

export function IconButton({
  icon,
  label,
  showLabel = false,
  pressed,
  tone = 'default',
  variant = 'default',
  size = 'md',
  type = 'button',
  className,
  ...props
}: Props) {
  const classes = [styles.button, styles[tone], variant === 'ambient' && styles.ambient, size === 'sm' && styles.sm, showLabel && styles.withLabel, className]
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
