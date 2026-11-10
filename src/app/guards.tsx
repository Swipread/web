import { Navigate, Outlet, useLocation, useSearchParams } from 'react-router'
import { getErrorMessage } from '../api/problem'
import { useMe, useSession } from '../features/auth/useAuth'
import { getRedirectTarget } from '../features/auth/redirect'
import { ErrorState } from '../ui/ErrorState'
import { LoadingState } from '../ui/LoadingState'

/** Pages that need a session: otherwise go to login, remembering the target. */
export function RequireAuth() {
  const current = useSession()
  const location = useLocation()
  if (!current) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/connexion?redirect=${redirect}`} replace />
  }
  return <Outlet />
}

/** Login and sign-up pages: once a session exists, leave them. */
export function RedirectIfAuthenticated() {
  const current = useSession()
  const [searchParams] = useSearchParams()
  if (current) return <Navigate to={getRedirectTarget(searchParams)} replace />
  return <Outlet />
}

/** Readers without topics must pick them before reaching the app. */
export function RequireOnboarding() {
  const me = useMe()
  if (me.isPending) return <LoadingState />
  if (me.isError) {
    return (
      <ErrorState
        message={getErrorMessage(me.error)}
        onRetry={() => void me.refetch()}
        retrying={me.isRefetching}
      />
    )
  }
  if (!me.data.topics?.length) return <Navigate to="/centres-interet" replace />
  return <Outlet />
}

/**
 * Administration pages: only for the ADMIN role from GET /v1/me.
 * The API answers 403 anyway; this only keeps readers away from screens they cannot use.
 */
export function RequireAdmin() {
  const me = useMe()
  // RequireOnboarding has already loaded the profile.
  if (me.data?.role !== 'ADMIN') return <Navigate to="/" replace />
  return <Outlet />
}
