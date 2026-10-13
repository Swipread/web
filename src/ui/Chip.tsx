import type { ButtonHTMLAttributes } from 'react'
import styles from './Chip.module.css'

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'aria-pressed'> & {
  selected: boolean
}

export function Chip({ selected, type = 'button', className, ...props }: Props) {
  return (
    <button
      type={type}
      aria-pressed={selected}
      className={[styles.chip, className].filter(Boolean).join(' ')}
      {...props}
    />
  )
}
