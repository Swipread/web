import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CheckIcon } from './icons'
import styles from './Chip.module.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  selected: boolean
  /** Shown before the label when selected; a check mark by default. */
  marker?: ReactNode
}

export function Chip({ selected, marker, type = 'button', className, children, ...props }: Props) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[styles.chip, className].filter(Boolean).join(' ')}
      {...props}
    >
      {selected && (marker ?? <CheckIcon size={14} strokeWidth={2.25} />)}
      {children}
    </button>
  )
}
