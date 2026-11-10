import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'
import type { Schema } from '../../api/types'
import { meQueryKey } from '../auth/useAuth'
import { topicsQueryKey } from '../onboarding/useTopics'

type AdminTopic = Schema<'AdminTopicResponse'>

export const adminTopicsQueryKey = ['admin', 'topics'] as const

// Same order as the API (by label).
const byLabel = (a: AdminTopic, b: AdminTopic) => (a.label ?? '').localeCompare(b.label ?? '', 'fr')

/** US18: readers must see new and renamed topics right away (onboarding, profile). */
function refreshReaderTopics(queryClient: QueryClient) {
  void queryClient.invalidateQueries({ queryKey: topicsQueryKey })
  void queryClient.invalidateQueries({ queryKey: meQueryKey })
}

export function useAdminTopics() {
  return useQuery({
    queryKey: adminTopicsQueryKey,
    queryFn: ({ signal }) => unwrap(api.GET('/v1/admin/topics', { signal })),
  })
}

export function useCreateTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (label: string) => unwrap(api.POST('/v1/admin/topics', { body: { label } })),
    onSuccess: (created) => {
      queryClient.setQueryData<AdminTopic[]>(adminTopicsQueryKey, (topics) =>
        topics && [...topics, created].sort(byLabel),
      )
      refreshReaderTopics(queryClient)
    },
  })
}

export function useRenameTopic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, label }: { id: number; label: string }) =>
      unwrap(api.PATCH('/v1/admin/topics/{id}', { params: { path: { id } }, body: { label } })),
    onSuccess: (renamed) => {
      queryClient.setQueryData<AdminTopic[]>(adminTopicsQueryKey, (topics) =>
        topics?.map((topic) => (topic.id === renamed.id ? renamed : topic)).sort(byLabel),
      )
      refreshReaderTopics(queryClient)
    },
  })
}
