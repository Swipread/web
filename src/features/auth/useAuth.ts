import { useCallback, useSyncExternalStore } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { api, unwrap } from '../../api/client'
import { session } from '../../lib/session'
import { tracker } from '../tracking/tracker'
import type { LoginValues, RegisterValues } from './schemas'

export const meQueryKey = ['me'] as const

export function useSession() {
  return useSyncExternalStore(session.subscribe, session.get)
}

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: ({ signal }) => unwrap(api.GET('/v1/me', { signal })),
    // Mutations on the profile update this cache, no need to refetch on every page.
    staleTime: 5 * 60_000,
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginValues) => unwrap(api.POST('/v1/auth/login', { body })),
    onSuccess: (token) => session.save(token),
  })
}

/** Sends the browser locale only when it matches the backend's `xx-XX` pattern. */
function browserLocale() {
  const locale = navigator.language
  return /^[a-z]{2}-[A-Z]{2}$/.test(locale) ? locale : undefined
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: RegisterValues) =>
      unwrap(api.POST('/v1/auth/register', { body: { ...body, locale: browserLocale() } })),
    onSuccess: (token) => session.save(token),
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useCallback(() => {
    // Close the current card's view and send pending events while the token is still known.
    void tracker.flushOnExit()
    tracker.clear()
    // Revoke the refresh token (cookie). Not awaited: the reader leaves at once, a failure only leaves a token
    // that expires on its own.
    void api.POST('/v1/auth/logout').catch(() => undefined)
    session.clear()
    queryClient.clear()
    void navigate('/connexion', { replace: true })
  }, [navigate, queryClient])
}
