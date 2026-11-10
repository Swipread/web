import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, unwrap } from '../../api/client'
import type { Schema } from '../../api/types'
import type { SourceValues } from './schemas'

type Source = Schema<'SourceResponse'>

export const sourcesQueryKey = ['admin', 'sources'] as const

// Same order as the API (by name), so a new source lands where a reload would put it.
const byName = (a: Source, b: Source) => (a.name ?? '').localeCompare(b.name ?? '', 'fr')

export function useSources() {
  return useQuery({
    queryKey: sourcesQueryKey,
    queryFn: ({ signal }) => unwrap(api.GET('/v1/admin/sources', { signal })),
  })
}

export function useCreateSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ license, ...values }: SourceValues) =>
      unwrap(api.POST('/v1/admin/sources', { body: { ...values, license: license || undefined } })),
    onSuccess: (created) =>
      queryClient.setQueryData<Source[]>(sourcesQueryKey, (sources) => sources && [...sources, created].sort(byName)),
  })
}

export function useSetSourceActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) =>
      unwrap(api.PATCH('/v1/admin/sources/{id}', { params: { path: { id } }, body: { active } })),
    onSuccess: (updated) =>
      queryClient.setQueryData<Source[]>(sourcesQueryKey, (sources) =>
        sources?.map((source) => (source.id === updated.id ? updated : source)),
      ),
  })
}

/** Answers 409 when the source already has articles: it must be deactivated instead. */
export function useDeleteSource() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => unwrap(api.DELETE('/v1/admin/sources/{id}', { params: { path: { id } } })),
    onSuccess: (_, id) =>
      queryClient.setQueryData<Source[]>(sourcesQueryKey, (sources) => sources?.filter((source) => source.id !== id)),
  })
}
