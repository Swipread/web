import type { QueryClient } from '@tanstack/react-query'
import type { createBrowserRouter } from 'react-router'

type Router = Pick<ReturnType<typeof createBrowserRouter>, 'navigate' | 'state'>

export const LOGIN_PATH = '/connexion'

/** Sends the user to the login page, remembering where they were. */
export function createUnauthorizedHandler(router: Router, queryClient: QueryClient) {
  return () => {
    queryClient.clear()
    const { pathname, search } = router.state.location
    if (pathname === LOGIN_PATH) return
    const redirect = encodeURIComponent(pathname + search)
    void router.navigate(`${LOGIN_PATH}?redirect=${redirect}`, { replace: true })
  }
}
