import type { ButtonHTMLAttributes } from 'react'
import { CheckIcon } from './icons'
import styles from './Chip.module.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  selected: boolean
}

export function Chip({ selected, type = 'button', className, children, ...props }: Props) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[styles.chip, className].filter(Boolean).join(' ')}
      {...props}
    >
      {selected && <CheckIcon size={14} strokeWidth={2.25} />}
      {children}
    </button>
  )
}
