import { useCallback, useMemo } from 'react'
import { useInfiniteQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'
import type { Schema } from '../../api/types'
import { getSessionId } from '../../lib/ids'
import { getDevice } from '../../lib/media'

/** A feed item whose reaction state is always set, then updated locally as the reader acts. */
export type FeedCard = Schema<'FeedItem'> & { articleId: string; liked: boolean; saved: boolean }
type FeedPage = { items: FeedCard[] }

export const feedQueryKey = ['feed'] as const

function updateFeedPages(queryClient: QueryClient, update: (items: FeedCard[]) => FeedCard[]) {
  queryClient.setQueryData<InfiniteData<FeedPage>>(feedQueryKey, (data) =>
    data && { ...data, pages: data.pages.map((page) => ({ items: update(page.items) })) },
  )
}

/** Updates a card's reaction state in the cached feed, e.g. after unsaving it from another page. */
export function patchFeedCard(
  queryClient: QueryClient,
  articleId: string,
  patch: Partial<Pick<FeedCard, 'liked' | 'saved'>>,
) {
  updateFeedPages(queryClient, (list) =>
    list.map((item) => (item.articleId === articleId ? { ...item, ...patch } : item)),
  )
}

async function fetchFeedPage(signal: AbortSignal): Promise<FeedPage> {
  const response = await unwrap(
    api.GET('/v1/feed', {
      params: { header: { 'X-Session-Id': getSessionId(), 'X-Device': getDevice() } },
      signal,
    }),
  )
  const items = (response.items ?? []).flatMap((item) =>
    item.articleId ? [{ ...item, articleId: item.articleId, liked: item.liked ?? false, saved: item.saved ?? false }] : [],
  )
  return { items }
}

export function useFeed() {
  const queryClient = useQueryClient()
  const query = useInfiniteQuery({
    queryKey: feedQueryKey,
    queryFn: ({ signal }) => fetchFeedPage(signal),
    initialPageParam: 0,
    // No cursor: each call returns the next articles. An empty page means the catalog is exhausted.
    getNextPageParam: (lastPage, pages) => (lastPage.items.length > 0 ? pages.length : undefined),
    // Refetching would replace pages with new articles: keep what was served.
    staleTime: Infinity,
    gcTime: 30 * 60_000,
  })

  const items = useMemo(() => {
    const seen = new Set<string>()
    return (query.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((item) => !seen.has(item.articleId) && seen.add(item.articleId))
  }, [query.data])

  const updateCard = useCallback(
    (articleId: string, patch: Partial<Pick<FeedCard, 'liked' | 'saved'>>) =>
      patchFeedCard(queryClient, articleId, patch),
    [queryClient],
  )

  const removeCard = useCallback(
    (articleId: string) =>
      updateFeedPages(queryClient, (list) => list.filter((item) => item.articleId !== articleId)),
    [queryClient],
  )

  return { ...query, items, updateCard, removeCard }
}
