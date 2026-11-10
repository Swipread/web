import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { admin, token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

describe('admin access', () => {
  beforeEach(() => {
    session.save(token)
  })

  it('sends readers back to the feed and hides the admin links', async () => {
    const { router } = renderRoutes(routes, { path: '/admin/sources' })
    // <Navigate> redirects in an effect: wait for it before checking the active link.
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByRole('link', { name: 'Pour vous' })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('link', { name: 'Sources' })).not.toBeInTheDocument()
  })

  it('shows the administration section to admins', async () => {
    server.use(http.get(apiUrl('/v1/me'), () => HttpResponse.json(admin)))
    const { user } = renderRoutes(routes, { path: '/profil' })
    const nav = await screen.findByRole('navigation', { name: 'Navigation principale' })

    await user.click(await within(nav).findByRole('link', { name: 'Thèmes' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Thèmes' })).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Admin' })).toHaveAttribute('aria-current', 'page')

    // Mobile tabs between the admin pages.
    const adminTabs = screen.getByRole('navigation', { name: "Pages d'administration" })
    await user.click(within(adminTabs).getByRole('link', { name: 'Sources' }))
    expect(await screen.findByRole('heading', { level: 1, name: "Sources d'articles" })).toBeInTheDocument()
  })

  it('opens the sources page from /admin', async () => {
    server.use(http.get(apiUrl('/v1/me'), () => HttpResponse.json(admin)))
    const { router } = renderRoutes(routes, { path: '/admin' })
    expect(await screen.findByRole('heading', { level: 1, name: "Sources d'articles" })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin/sources')
  })

  it('explains a 403 from the API (role removed since login)', async () => {
    server.use(
      http.get(apiUrl('/v1/me'), () => HttpResponse.json(admin)),
      http.get(apiUrl('/v1/admin/sources'), () => new HttpResponse(null, { status: 403 })),
    )
    renderRoutes(routes, { path: '/admin/sources' })
    expect(await screen.findByRole('alert')).toHaveTextContent("Vous n'avez pas accès à cette page.")
  })
})
