import { useInfiniteQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import { useCallback } from 'react'
import { api, unwrap } from '../../api/client'
import type { Schema } from '../../api/types'
import { patchFeedCard } from '../feed/useFeed'
import { tracker } from '../tracking/tracker'

export const savedQueryKey = ['saved'] as const
const PAGE_SIZE = 20

type SavedPage = Schema<'SavedPageResponse'>

export function useSaved() {
  return useInfiniteQuery({
    queryKey: savedQueryKey,
    queryFn: async ({ pageParam, signal }) => {
      // Saves travel as events: send pending ones first so a just-saved article is listed.
      await tracker.flush()
      return unwrap(
        api.GET('/v1/me/saved', { params: { query: { cursor: pageParam, limit: PAGE_SIZE } }, signal }),
      )
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
  })
}

/**
 * Removes an article from the saved list. Unsaving is an `unsave` event (there is no endpoint),
 * so the list and the cached feed are updated locally right away.
 */
export function useUnsave() {
  const queryClient = useQueryClient()
  return useCallback(
    (articleId: string) => {
      tracker.track({ type: 'unsave', articleId })
      queryClient.setQueryData<InfiniteData<SavedPage>>(savedQueryKey, (data) =>
        data && {
          ...data,
          pages: data.pages.map((page) => ({
            ...page,
            items: page.items?.filter((item) => item.article?.id !== articleId),
          })),
        },
      )
      patchFeedCard(queryClient, articleId, { saved: false })
    },
    [queryClient],
  )
}
