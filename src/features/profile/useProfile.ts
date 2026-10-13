import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { api, unwrap } from '../../api/client'
import { session } from '../../lib/session'
import { meQueryKey } from '../auth/useAuth'
import { tracker } from '../tracking/tracker'
import { useToast } from '../../ui/toastContext'
import type { ProfileValues } from './schemas'

export function useUpdateProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: ProfileValues) => unwrap(api.PATCH('/v1/me', { body })),
    onSuccess: (me) => queryClient.setQueryData(meQueryKey, me),
  })
}

/**
 * Deletes the account. The token is refused afterwards, so everything tied to the session goes:
 * pending events (their data is deleted anyway), the session and the cache.
 */
export function useDeleteAccount() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  return useMutation({
    mutationFn: () => unwrap(api.DELETE('/v1/me')),
    onSuccess: () => {
      tracker.clear()
      session.clear()
      queryClient.clear()
      void navigate('/connexion', { replace: true })
      toast.show('Votre compte a été supprimé')
    },
  })
}
