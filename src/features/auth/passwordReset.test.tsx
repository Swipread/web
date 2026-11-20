import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

const problem = (status: number, extra: object = {}) =>
  HttpResponse.json(
    { status, title: 'Error', detail: 'English detail', ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

describe('forgotten password', () => {
  it('is linked from the login page with the email already typed', async () => {
    const { user, router } = renderRoutes(routes, { path: '/connexion' })

    await user.type(screen.getByLabelText('Email'), ' lea@exemple.fr ')
    await user.click(screen.getByRole('link', { name: 'Mot de passe oublié ?' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/mot-de-passe-oublie'))
    expect(screen.getByLabelText('Email')).toHaveValue('lea@exemple.fr')
  })

  it('sends the address without a token and answers the same whatever it is', async () => {
    const sent: unknown[] = []
    server.use(
      http.post(apiUrl('/v1/auth/password/forgot'), async ({ request }) => {
        sent.push({
          body: await request.json(),
          authorization: request.headers.get('Authorization'),
        })
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const { user } = renderRoutes(routes, { path: '/mot-de-passe-oublie' })

    await user.type(screen.getByLabelText('Email'), ' lea@exemple.fr ')
    await user.click(screen.getByRole('button', { name: 'Recevoir le lien' }))

    expect(await screen.findByRole('heading', { name: 'Vérifiez vos e-mails' })).toBeInTheDocument()
    expect(screen.getByText(/Si un compte existe pour lea@exemple.fr/)).toBeInTheDocument()
    expect(sent).toEqual([{ body: { email: 'lea@exemple.fr' }, authorization: null }])
  })

  it('validates the address and shows a server error with the form kept', async () => {
    server.use(http.post(apiUrl('/v1/auth/password/forgot'), () => problem(503)))
    const { user } = renderRoutes(routes, { path: '/mot-de-passe-oublie' })

    await user.click(screen.getByRole('button', { name: 'Recevoir le lien' }))
    expect(await screen.findByText('Saisissez votre email.')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Email'), 'lea@exemple.fr')
    await user.click(screen.getByRole('button', { name: 'Recevoir le lien' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('momentanément indisponible')
    expect(screen.getByLabelText('Email')).toHaveValue('lea@exemple.fr')
  })
})

describe('reset password page', () => {
  async function choose(user: ReturnType<typeof renderRoutes>['user'], password: string, confirmation = password) {
    await user.type(screen.getByLabelText('Nouveau mot de passe'), password)
    await user.type(screen.getByLabelText('Confirmer le nouveau mot de passe'), confirmation)
    await user.click(screen.getByRole('button', { name: 'Enregistrer le mot de passe' }))
  }

  it('sets the new password, then asks to log in with it', async () => {
    const sent: unknown[] = []
    server.use(
      http.post(apiUrl('/v1/auth/password/reset'), async ({ request }) => {
        sent.push(await request.json())
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user, router } = renderRoutes(routes, {
      path: '/reinitialiser-mot-de-passe?token=abc_DEF-123',
    })

    await choose(user, 'nouveau-secret')

    await waitFor(() => expect(router.state.location.pathname).toBe('/connexion'))
    // The path changes before the login page renders its notice: wait for the notice itself.
    expect(await screen.findByText('Mot de passe modifié. Connectez-vous avec le nouveau.')).toHaveAttribute(
      'role',
      'status',
    )
    expect(sent).toEqual([{ token: 'abc_DEF-123', newPassword: 'nouveau-secret' }])
  })

  it('forgets a session kept in this browser, which the API signed out', async () => {
    session.save(token)
    server.use(http.post(apiUrl('/v1/auth/password/reset'), () => new HttpResponse(null, { status: 204 })))
    const { user, router } = renderRoutes(routes, {
      path: '/reinitialiser-mot-de-passe?token=abc',
    })

    await choose(user, 'nouveau-secret')

    await waitFor(() => expect(router.state.location.pathname).toBe('/connexion'))
    expect(session.get()).toBeNull()
  })

  it('checks the rules and the confirmation before sending', async () => {
    let calls = 0
    server.use(
      http.post(apiUrl('/v1/auth/password/reset'), () => {
        calls += 1
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderRoutes(routes, {
      path: '/reinitialiser-mot-de-passe?token=abc',
    })

    await choose(user, 'court')
    expect(await screen.findByText('Le mot de passe doit contenir au moins 8 caractères.')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Nouveau mot de passe'))
    await user.clear(screen.getByLabelText('Confirmer le nouveau mot de passe'))
    await choose(user, 'nouveau-secret', 'autre-secret')
    expect(await screen.findByText('Les deux mots de passe ne correspondent pas.')).toBeInTheDocument()
    expect(calls).toBe(0)
  })

  it('explains a used or expired link and offers a new one', async () => {
    server.use(http.post(apiUrl('/v1/auth/password/reset'), () => problem(400)))
    const { user } = renderRoutes(routes, {
      path: '/reinitialiser-mot-de-passe?token=old',
    })

    await choose(user, 'nouveau-secret')

    expect(
      await screen.findByRole('heading', {
        name: 'Ce lien n’est plus valable',
      }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Recevoir un nouveau lien' })).toHaveAttribute(
      'href',
      '/mot-de-passe-oublie',
    )
  })

  it('keeps the form for a rejected password', async () => {
    server.use(
      http.post(apiUrl('/v1/auth/password/reset'), () =>
        problem(400, {
          errors: [
            {
              field: 'newPassword',
              code: 'Size',
              message: 'size must be between 8 and 72',
            },
          ],
        }),
      ),
    )
    const { user } = renderRoutes(routes, {
      path: '/reinitialiser-mot-de-passe?token=abc',
    })

    await choose(user, 'nouveau-secret')

    expect(
      await screen.findByRole('button', {
        name: 'Enregistrer le mot de passe',
      }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Nouveau mot de passe')).toHaveAttribute('aria-invalid', 'true')
  })

  it('needs a token', () => {
    renderRoutes(routes, { path: '/reinitialiser-mot-de-passe' })
    expect(screen.getByRole('heading', { name: 'Ce lien n’est plus valable' })).toBeInTheDocument()
  })
})
