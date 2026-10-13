import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'
import type { Schema } from '../../api/types'
import { meQueryKey } from '../auth/useAuth'
import { feedPosition } from '../feed/feedPosition'
import { feedQueryKey } from '../feed/useFeed'

/** US3 requires 3 topics; the API only enforces 1 (docs/demandes-backend.md #9). */
export const MIN_TOPICS = 3

export function useTopics() {
  return useQuery({
    queryKey: ['topics'],
    queryFn: ({ signal }) => unwrap(api.GET('/v1/topics', { signal })),
  })
}

export function useUpdateTopics() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (topicIds: number[]) => unwrap(api.PUT('/v1/me/topics', { body: { topicIds } })),
    onSuccess: (topics) => {
      queryClient.setQueryData<Schema<'MeResponse'>>(meQueryKey, (me) => me && { ...me, topics })
      // US4: the next articles must reflect the new topics.
      queryClient.removeQueries({ queryKey: feedQueryKey })
      feedPosition.clear()
    },
  })
}
