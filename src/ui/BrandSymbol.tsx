import type { ReactNode } from 'react'
import styles from './BrandSymbol.module.css'

type Props = {
  /** Side in pixels. */
  size?: number
  /**
   * What lights the lower guillemet (the current article's image, or its topic's colours). Without it the
   * symbol stays monochrome, as on the app icon.
   */
  light?: ReactNode
}

/** « Les guillemets qui montent »: two press guillemets turned upward, the swipe gesture. Decorative. */
export function BrandSymbol({ size = 28, light }: Props) {
  return (
    <span className={styles.symbol} aria-hidden="true">
      <svg viewBox="0 0 64 64" width={size} height={size} focusable="false">
        <rect width="64" height="64" rx="15" className={styles.ground} />
        <path d="M15 31 32 14l17 17-5.5 5.5L32 25 20.5 36.5z" fill="currentColor" />
        {!light && <path d="M15 45 32 28l17 17-5.5 5.5L32 39 20.5 50.5z" fill="currentColor" fillOpacity=".5" />}
      </svg>
      {light && (
        <>
          <span className={styles.glow}>
            <span className={styles.light}>{light}</span>
          </span>
          <span className={styles.light}>{light}</span>
        </>
      )}
    </span>
  )
}
