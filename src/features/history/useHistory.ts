import { useInfiniteQuery, useQueryClient, type InfiniteData, type QueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api, unwrap } from '../../api/client'
import type { Schema } from '../../api/types'
import { patchFeedCard } from '../feed/useFeed'
import { savedQueryKey } from '../saved/useSaved'
import { tracker } from '../tracking/tracker'

export const historyQueryKey = ['history'] as const
const PAGE_SIZE = 20

type HistoryPage = Schema<'HistoryPageResponse'>

/** Updates an article's saved flag in the cached history, e.g. after unsaving it from Sauvegardés. */
export function patchHistorySaved(queryClient: QueryClient, articleId: string, saved: boolean) {
  queryClient.setQueryData<InfiniteData<HistoryPage>>(historyQueryKey, (data) =>
    data && {
      ...data,
      pages: data.pages.map((page) => ({
        ...page,
        items: page.items?.map((item) => (item.article?.id === articleId ? { ...item, saved } : item)),
      })),
    },
  )
}

/**
 * Saves or unsaves an article from the history. Like in the feed it is a `save` / `unsave` event: the history and
 * the cached feed change at once, the saved list is fetched again on its next visit.
 */
export function useHistorySave() {
  const queryClient = useQueryClient()
  return useCallback(
    (articleId: string, saved: boolean) => {
      tracker.track({ type: saved ? 'save' : 'unsave', articleId })
      patchHistorySaved(queryClient, articleId, saved)
      patchFeedCard(queryClient, articleId, { saved })
      void queryClient.invalidateQueries({ queryKey: savedQueryKey })
    },
    [queryClient],
  )
}

export function useHistory() {
  return useInfiniteQuery({
    queryKey: historyQueryKey,
    queryFn: async ({ pageParam, signal }) => {
      // Articles enter the history through `open` events: send pending ones first.
      await tracker.flush()
      return unwrap(
        api.GET('/v1/me/history', { params: { query: { cursor: pageParam, limit: PAGE_SIZE } }, signal }),
      )
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  })
}
