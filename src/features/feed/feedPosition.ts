const POSITION_KEY = 'swipread.feed.articleId'

/** Remembers the card on screen so the feed reopens on it. */
export const feedPosition = {
  get(): string | null {
    try {
      return sessionStorage.getItem(POSITION_KEY)
    } catch {
      return null
    }
  },
  set(articleId: string) {
    try {
      sessionStorage.setItem(POSITION_KEY, articleId)
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(POSITION_KEY)
    } catch {
      // ignore
    }
  },
}
