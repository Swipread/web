import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { me, token, topics } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

describe('profile', () => {
  beforeEach(() => {
    session.save(token)
  })

  it('shows the display name and email', async () => {
    renderRoutes(routes, { path: '/profil' })
    expect(await screen.findByLabelText('Nom affiché')).toHaveValue('Léa')
    expect(screen.getByLabelText('Email (non modifiable)')).toHaveValue('lea@exemple.fr')
  })

  it('updates topics and resets the feed', async () => {
    let sent: unknown
    server.use(
      http.put(apiUrl('/v1/me/topics'), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json([topics[0], topics[1], topics[3]])
      }),
    )
    const { user, queryClient } = renderRoutes(routes, { path: '/profil' })
    queryClient.setQueryData(['feed'], { pages: [], pageParams: [] })
    sessionStorage.setItem('swipread.feed.articleId', 'a_1')

    const save = await screen.findByRole('button', { name: 'Enregistrer mes thèmes' })
    expect(screen.getByRole('button', { name: 'Culture' })).toHaveAttribute('aria-pressed', 'true')
    expect(save).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Culture' }))
    expect(screen.getByText('2 thèmes sélectionnés · encore 1 à choisir')).toBeInTheDocument()
    expect(save).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Sport' }))
    await user.click(save)

    expect(await screen.findByText('Centres d’intérêt enregistrés')).toBeInTheDocument()
    expect(sent).toEqual({ topicIds: [1, 2, 4] })
    await waitFor(() => expect(save).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Sport' })).toHaveAttribute('aria-pressed', 'true')
    expect(queryClient.getQueryData(['feed'])).toBeUndefined()
    expect(sessionStorage.getItem('swipread.feed.articleId')).toBeNull()
  })

  it('reports a failed update', async () => {
    server.use(http.put(apiUrl('/v1/me/topics'), () => new HttpResponse(null, { status: 503 })))
    const { user } = renderRoutes(routes, { path: '/profil' })

    await user.click(await screen.findByRole('button', { name: 'Sport' }))
    await user.click(screen.getByRole('button', { name: 'Enregistrer mes thèmes' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('momentanément indisponible')
  })

  it('offers a retry when the profile fails to load', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/me'), () =>
        ++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(me),
      ),
    )
    const { user } = renderRoutes(routes, { path: '/profil' })
    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByLabelText('Nom affiché')).toHaveValue('Léa')
  })
})
