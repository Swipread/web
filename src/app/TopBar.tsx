import type { ReactNode } from 'react'
import { BrandSymbol } from '../ui/BrandSymbol'
import styles from './TopBar.module.css'

type Props = {
  /** `ambient`: drawn over the feed's ambient field; `paper`: on the plain page ground. */
  tone: 'ambient' | 'paper'
  /** Lights the symbol's lower guillemet (the feed's current article). */
  symbolLight?: ReactNode
  /** Right-hand side: the page's name on the feed, hints. */
  children?: ReactNode
}

/** The app's top bar: the symbol and the name, the same on every signed-in page. */
export function TopBar({ tone, symbolLight, children }: Props) {
  return (
    <header className={`${styles.bar} ${styles[tone]}`}>
      <span className={styles.brand}>
        <BrandSymbol size={28} light={symbolLight} />
        Swipread
      </span>
      {children && <div className={styles.trailing}>{children}</div>}
    </header>
  )
}
