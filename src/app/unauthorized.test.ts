import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { createUnauthorizedHandler } from './unauthorized'

function fakeRouter(pathname: string, search = '') {
  return {
    state: { location: { pathname, search } },
    navigate: vi.fn(),
  } as unknown as Parameters<typeof createUnauthorizedHandler>[0]
}

describe('createUnauthorizedHandler', () => {
  it('redirects to login with the current location and clears cached data', () => {
    const router = fakeRouter('/sauvegardes', '?page=2')
    const queryClient = new QueryClient()
    queryClient.setQueryData(['me'], { id: 'u_1' })

    createUnauthorizedHandler(router, queryClient)()

    expect(router.navigate).toHaveBeenCalledWith('/connexion?redirect=%2Fsauvegardes%3Fpage%3D2', {
      replace: true,
    })
    expect(queryClient.getQueryData(['me'])).toBeUndefined()
  })

  it('stays put when already on the login page', () => {
    const router = fakeRouter('/connexion')
    createUnauthorizedHandler(router, new QueryClient())()
    expect(router.navigate).not.toHaveBeenCalled()
  })
})
