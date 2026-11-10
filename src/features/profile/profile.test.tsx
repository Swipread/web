import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { me, token, topics } from '../../test/fixtures'
import { tracker } from '../tracking/tracker'
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

  describe('display name', () => {
    it('saves the new name', async () => {
      let sent: unknown
      server.use(
        http.patch(apiUrl('/v1/me'), async ({ request }) => {
          sent = await request.json()
          return HttpResponse.json({ ...me, displayName: 'Léa M.' })
        }),
      )
      const { user, queryClient } = renderRoutes(routes, { path: '/profil' })
      const name = await screen.findByLabelText('Nom affiché')
      const save = screen.getByRole('button', { name: 'Enregistrer' })
      expect(save).toBeDisabled()

      await user.clear(name)
      await user.type(name, '  Léa M. ')
      await user.click(save)

      expect(await screen.findByText('Nom enregistré')).toBeInTheDocument()
      expect(sent).toEqual({ displayName: 'Léa M.' })
      expect(name).toHaveValue('Léa M.')
      expect(save).toBeDisabled()
      expect(queryClient.getQueryData(['me'])).toMatchObject({ displayName: 'Léa M.' })
    })

    it('validates the name before sending', async () => {
      const { user } = renderRoutes(routes, { path: '/profil' })
      const name = await screen.findByLabelText('Nom affiché')

      await user.clear(name)
      await user.type(name, '   ')
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

      expect(await screen.findByText('Saisissez le nom à afficher.')).toBeInTheDocument()
      expect(name).toHaveAttribute('aria-invalid', 'true')
    })

    it('shows the server validation error on the field', async () => {
      server.use(
        http.patch(apiUrl('/v1/me'), () =>
          HttpResponse.json(
            { title: 'Bad Request', status: 400, errors: [{ field: 'displayName', code: 'NotBlank', message: 'must not be blank' }] },
            { status: 400, headers: { 'Content-Type': 'application/problem+json' } },
          ),
        ),
      )
      const { user } = renderRoutes(routes, { path: '/profil' })
      const name = await screen.findByLabelText('Nom affiché')

      await user.type(name, 'x')
      await user.click(screen.getByRole('button', { name: 'Enregistrer' }))

      await waitFor(() => expect(name).toHaveAttribute('aria-invalid', 'true'))
      expect(screen.getByText('Ce champ est obligatoire.')).toBeInTheDocument()
    })
  })

  describe('account deletion', () => {
    it('asks for confirmation and can be cancelled', async () => {
      let deleted = false
      server.use(
        http.delete(apiUrl('/v1/me'), () => {
          deleted = true
          return new HttpResponse(null, { status: 204 })
        }),
      )
      const { user } = renderRoutes(routes, { path: '/profil' })

      await user.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }))
      const dialog = screen.getByRole('dialog', { name: 'Supprimer votre compte ?' })
      expect(within(dialog).getByRole('button', { name: 'Annuler' })).toHaveFocus()

      await user.click(within(dialog).getByRole('button', { name: 'Annuler' }))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      expect(deleted).toBe(false)
    })

    it('deletes the account, forgets the session and returns to the login page', async () => {
      let deleted = false
      const events: unknown[] = []
      server.use(
        http.delete(apiUrl('/v1/me'), () => {
          deleted = true
          return new HttpResponse(null, { status: 204 })
        }),
        http.post(apiUrl('/v1/events'), () => {
          events.push('sent')
          return new HttpResponse(null, { status: 401 })
        }),
      )
      const { user } = renderRoutes(routes, { path: '/profil' })
      tracker.track({ type: 'save', articleId: 'a_1' })

      await user.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }))
      await user.click(screen.getByRole('button', { name: 'Supprimer définitivement' }))

      expect(await screen.findByRole('heading', { name: /connexion|connecter/i })).toBeInTheDocument()
      expect(screen.getByText('Votre compte a été supprimé')).toBeInTheDocument()
      expect(deleted).toBe(true)
      expect(session.get()).toBeNull()
      await tracker.flush()
      expect(events).toEqual([])
    })

    it('shows an error in the dialog when the deletion fails', async () => {
      server.use(http.delete(apiUrl('/v1/me'), () => new HttpResponse(null, { status: 500 })))
      const { user } = renderRoutes(routes, { path: '/profil' })

      await user.click(await screen.findByRole('button', { name: 'Supprimer mon compte' }))
      await user.click(screen.getByRole('button', { name: 'Supprimer définitivement' }))

      const dialog = screen.getByRole('dialog')
      expect(await within(dialog).findByRole('alert')).toBeInTheDocument()
      expect(session.get()).not.toBeNull()
    })
  })
})
