import { useInfiniteQuery } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'
import { tracker } from '../tracking/tracker'

export const savedQueryKey = ['saved'] as const
const PAGE_SIZE = 20

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
