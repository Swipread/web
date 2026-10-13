import type { ButtonHTMLAttributes } from 'react'
import { Spinner } from './Spinner'
import styles from './Button.module.css'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
  loading?: boolean
}

export function Button({
  variant = 'primary',
  fullWidth = false,
  loading = false,
  type = 'button',
  disabled,
  className,
  children,
  ...props
}: Props) {
  const classes = [styles.button, styles[variant], fullWidth && styles.fullWidth, className]
    .filter(Boolean)
    .join(' ')
  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" label={null} />}
      {children}
    </button>
  )
}
