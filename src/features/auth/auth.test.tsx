import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { me, token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

const problem = (status: number, extra: object = {}) =>
  HttpResponse.json(
    { status, title: 'Error', detail: 'English detail', ...extra },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

describe('login', () => {
  it('validates fields before calling the API', async () => {
    const { user } = renderRoutes(routes, { path: '/connexion' })
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Saisissez votre email.')).toBeInTheDocument()
    expect(screen.getByText('Saisissez votre mot de passe.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toHaveFocus()
  })

  it('shows a generic message on wrong credentials', async () => {
    server.use(http.post(apiUrl('/v1/auth/login'), () => problem(401)))
    const { user } = renderRoutes(routes, { path: '/connexion' })

    await user.type(screen.getByLabelText('Email'), 'lea@exemple.fr')
    await user.type(screen.getByLabelText('Mot de passe'), 'mauvais')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou mot de passe incorrect.')
    expect(session.get()).toBeNull()
  })

  it('saves the session and returns to the requested page', async () => {
    let body: unknown
    server.use(
      http.post(apiUrl('/v1/auth/login'), async ({ request }) => {
        body = await request.json()
        return HttpResponse.json(token)
      }),
    )
    const { user, router } = renderRoutes(routes, { path: '/connexion?redirect=%2Fprofil' })

    await user.type(screen.getByLabelText('Email'), ' lea@exemple.fr ')
    await user.type(screen.getByLabelText('Mot de passe'), 'secret123')
    await user.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/profil'))
    expect(body).toEqual({ email: 'lea@exemple.fr', password: 'secret123' })
    expect(session.get()?.accessToken).toBe('jwt-test')
  })
})

describe('registration', () => {
  async function fillForm(user: ReturnType<typeof renderRoutes>['user'], password = 'motdepasse') {
    await user.type(screen.getByLabelText('Nom affiché'), 'Léa')
    await user.type(screen.getByLabelText('Email'), 'lea@exemple.fr')
    await user.type(screen.getByLabelText('Mot de passe'), password)
    await user.click(screen.getByRole('button', { name: 'Créer mon compte' }))
  }

  it('enforces the minimum password length', async () => {
    const { user } = renderRoutes(routes, { path: '/inscription' })
    await fillForm(user, 'court')
    expect(
      await screen.findByText('Le mot de passe doit contenir au moins 8 caractères.'),
    ).toBeInTheDocument()
  })

  it('flags an email that is already used', async () => {
    server.use(http.post(apiUrl('/v1/auth/register'), () => problem(409)))
    const { user } = renderRoutes(routes, { path: '/inscription' })
    await fillForm(user)

    expect(await screen.findByText('Cet email est déjà utilisé.')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInvalid()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows server-side field errors on their field', async () => {
    server.use(
      http.post(apiUrl('/v1/auth/register'), () =>
        problem(400, { errors: [{ field: 'displayName', code: 'NotBlank', message: 'must not be blank' }] }),
      ),
    )
    const { user } = renderRoutes(routes, { path: '/inscription' })
    await fillForm(user)

    expect(await screen.findByText('Ce champ est obligatoire.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom affiché')).toBeInvalid()
  })

  it('logs the new reader in and sends them to onboarding', async () => {
    server.use(
      http.post(apiUrl('/v1/auth/register'), () => HttpResponse.json(token, { status: 201 })),
      http.get(apiUrl('/v1/me'), () => HttpResponse.json({ ...me, topics: [] })),
    )
    const { user, router } = renderRoutes(routes, { path: '/inscription' })
    await fillForm(user)

    await waitFor(() => expect(router.state.location.pathname).toBe('/centres-interet'))
    expect(session.get()?.userId).toBe('u_1')
  })
})

describe('guards', () => {
  it('sends visitors to login, remembering the page', async () => {
    const { router } = renderRoutes(routes, { path: '/sauvegardes' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/connexion'))
    expect(router.state.location.search).toBe('?redirect=%2Fsauvegardes')
  })

  it('lets onboarded readers in', async () => {
    session.save(token)
    renderRoutes(routes, { path: '/' })
    expect(await screen.findByRole('heading', { name: 'Pour vous' })).toBeInTheDocument()
  })

  it('keeps signed-in readers away from login', async () => {
    session.save(token)
    const { router } = renderRoutes(routes, { path: '/connexion' })
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('logs out', async () => {
    session.save(token)
    const { user, router } = renderRoutes(routes, { path: '/' })
    await user.click(await screen.findByRole('button', { name: 'Se déconnecter' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/connexion'))
    expect(session.get()).toBeNull()
  })
})
