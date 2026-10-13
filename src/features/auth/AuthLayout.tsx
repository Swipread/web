import type { ReactNode } from 'react'
import styles from './AuthLayout.module.css'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: Props) {
  return (
    <div className={styles.layout}>
      <section className={styles.presentation}>
        <div className={styles.presentationInner}>
          <p className={styles.brand}>Swipread</p>
          <p className={styles.tagline}>Des articles qui vous ressemblent, un défilement à la fois.</p>
          <div className={styles.illustration} aria-hidden="true">
            <span className={styles.stackCard} />
            <span className={styles.stackCard} />
            <span className={styles.stackCard} />
          </div>
        </div>
      </section>
      <main className={styles.formSide}>
        <div className={styles.formInner}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>{subtitle}</p>
          {children}
        </div>
      </main>
    </div>
  )
}
