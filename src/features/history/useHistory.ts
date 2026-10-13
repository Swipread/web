import { useInfiniteQuery } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'
import { tracker } from '../tracking/tracker'

export const historyQueryKey = ['history'] as const
const PAGE_SIZE = 20

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
