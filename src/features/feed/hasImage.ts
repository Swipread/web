import type { FeedCard } from './useFeed'

/** Whether a card shows its photo (it has one and it loaded). */
export function hasImage(card: FeedCard, failedImages: ReadonlySet<string>) {
  return Boolean(card.imageUrl) && !failedImages.has(card.articleId)
}
