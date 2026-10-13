import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router'
import { getErrorMessage } from '../../api/problem'
import { prefersReducedMotion } from '../../lib/media'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { Spinner } from '../../ui/Spinner'
import { ArticleActions } from './ArticleActions'
import { ArticleCard } from './ArticleCard'
import { feedPosition } from './feedPosition'
import { useActiveIndex } from './useActiveIndex'
import { useFeed } from './useFeed'
import { useFeedKeyboard } from './useFeedKeyboard'
import styles from './FeedPage.module.css'

/** Load the next page when this many cards or fewer remain below the current one. */
const PREFETCH_REMAINING = 3

export function FeedPage() {
  const feed = useFeed()
  const { items, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage } = feed
  const scrollerRef = useRef<HTMLDivElement>(null)
  const activeIndex = useActiveIndex(scrollerRef, items.length)
  const currentIndex = activeIndex ?? 0
  // Target of an in-flight keyboard scroll, so repeated presses keep moving forward.
  const pendingIndex = useRef<number | null>(null)
  const restored = useRef(false)
  // Slide to focus once a hidden card has left the list.
  const focusAfterHide = useRef<number | null>(null)

  const getSlide = (index: number) =>
    scrollerRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`) ?? null

  const scrollToIndex = useCallback((index: number) => {
    const slide = scrollerRef.current?.querySelector<HTMLElement>(`[data-index="${index}"]`)
    if (!slide) return
    pendingIndex.current = index
    slide.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
    slide.focus({ preventScroll: true })
  }, [])

  const lastIndex = items.length - 1
  const goNext = useCallback(() => {
    const from = pendingIndex.current ?? currentIndex
    // Past the last card, land on the loading/end slide.
    scrollToIndex(Math.min(from + 1, lastIndex + 1))
  }, [currentIndex, lastIndex, scrollToIndex])
  const goPrevious = useCallback(() => {
    const from = pendingIndex.current ?? currentIndex
    scrollToIndex(Math.max(from - 1, 0))
  }, [currentIndex, scrollToIndex])
  useFeedKeyboard(goNext, goPrevious)

  // Reopen on the card left last time (after reading an article or visiting another page).
  useLayoutEffect(() => {
    if (restored.current || items.length === 0) return
    restored.current = true
    const index = items.findIndex((item) => item.articleId === feedPosition.get())
    if (index > 0) getSlide(index)?.scrollIntoView({ block: 'start' })
  }, [items])

  useEffect(() => {
    if (activeIndex === null) return
    if (pendingIndex.current === activeIndex) pendingIndex.current = null
    const card = items[activeIndex]
    if (card) feedPosition.set(card.articleId)
  }, [activeIndex, items])

  useEffect(() => {
    const remaining = items.length - 1 - currentIndex
    if (remaining <= PREFETCH_REMAINING && hasNextPage && !isFetchingNextPage && !isFetchNextPageError) {
      void fetchNextPage()
    }
  }, [currentIndex, items.length, hasNextPage, isFetchingNextPage, isFetchNextPageError, fetchNextPage])

  // After hiding a card, move focus to the one that took its place.
  useEffect(() => {
    if (focusAfterHide.current === null) return
    getSlide(focusAfterHide.current)?.focus({ preventScroll: true })
    focusAfterHide.current = null
  }, [items])

  const hide = (index: number, articleId: string) => {
    focusAfterHide.current = index
    feed.removeCard(articleId)
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Pour vous</h1>
        <p className={styles.hint} aria-hidden="true">
          ↓ Faites défiler ou utilisez les flèches du clavier
        </p>
      </header>

      {feed.isPending ? (
        <div className={styles.status}>
          <Spinner label="Chargement de votre fil…" />
        </div>
      ) : feed.isError && items.length === 0 ? (
        <ErrorState
          message={getErrorMessage(feed.error)}
          onRetry={() => void feed.refetch()}
          retrying={feed.isRefetching}
        />
      ) : items.length === 0 && !hasNextPage ? (
        <EmptyState
          title="Votre fil est vide pour le moment"
          description="Ajoutez des centres d'intérêt pour découvrir de nouveaux articles."
          action={<Link to="/profil">Modifier mes centres d'intérêt</Link>}
        />
      ) : (
        <div
          ref={scrollerRef}
          className={styles.scroller}
          role="feed"
          aria-label="Articles recommandés"
          aria-busy={isFetchingNextPage}
        >
          {items.map((card, index) => (
            <article
              key={card.articleId}
              data-index={index}
              tabIndex={-1}
              className={styles.slide}
              aria-labelledby={`card-title-${card.articleId}`}
              aria-posinset={index + 1}
              aria-setsize={hasNextPage ? -1 : items.length}
            >
              <ArticleCard card={card} titleId={`card-title-${card.articleId}`} eager={index === 0} />
              <ArticleActions
                card={card}
                onToggleLike={() => feed.updateCard(card.articleId, { liked: !card.liked })}
                onSave={() => feed.updateCard(card.articleId, { saved: true })}
                onHide={() => hide(index, card.articleId)}
              />
            </article>
          ))}
          <div data-index={items.length} tabIndex={-1} className={`${styles.slide} ${styles.endSlide}`}>
            {isFetchNextPageError ? (
              <ErrorState
                message={getErrorMessage(feed.error)}
                onRetry={() => void fetchNextPage()}
                retrying={isFetchingNextPage}
              />
            ) : hasNextPage ? (
              <Spinner label="Chargement des articles suivants…" />
            ) : (
              <EmptyState
                title="Vous êtes à jour"
                description="Revenez un peu plus tard pour de nouveaux articles."
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
