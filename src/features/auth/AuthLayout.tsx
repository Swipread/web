import type { ReactNode } from 'react'
import { BrandSymbol } from '../../ui/BrandSymbol'
import { topicFieldClass } from '../../ui/topicField'
import styles from './AuthLayout.module.css'

type Props = {
  title: string
  subtitle: string
  children: ReactNode
}

/** The light the feed borrows from each article, shown here as the topics' colours taking turns. */
const LIGHTS = ['environment', 'science', 'culture', 'politics', 'economy', 'tech', 'sport', 'health']

export function AuthLayout({ title, subtitle, children }: Props) {
  const lights = LIGHTS.map((slug) => <span key={slug} className={`${styles.light} ${topicFieldClass(slug)}`} />)
  return (
    <div className={styles.layout}>
      <header className={styles.presentation}>
        <div className={styles.field} aria-hidden="true">
          {lights}
        </div>
        <div className={styles.presentationInner}>
          <p className={styles.brand}>
            <BrandSymbol size={56} light={<span className={styles.symbolLights}>{lights}</span>} />
            Swipread
          </p>
          <p className={styles.tagline}>Des articles qui vous ressemblent, un défilement à la fois.</p>
        </div>
      </header>
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
