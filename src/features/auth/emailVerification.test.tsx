import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { me, token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

const problem = (status: number) =>
  HttpResponse.json(
    { status, title: 'Error', detail: 'English detail' },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  )

const unverified = { ...me, emailVerified: false }

describe('email verification banner', () => {
  beforeEach(() => {
    session.save(token)
    sessionStorage.clear()
  })

  it('is not shown once the address is confirmed', async () => {
    renderRoutes(routes, { path: '/profil' })
    expect(await screen.findByLabelText('Nom affiché')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: "Confirmation de l'adresse e-mail" })).not.toBeInTheDocument()
  })

  it('reminds an unconfirmed reader and sends a new link', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/me'), () => HttpResponse.json(unverified)),
      http.post(apiUrl('/v1/me/verification-email'), () => {
        calls += 1
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const { user } = renderRoutes(routes, { path: '/profil' })

    const banner = await screen.findByRole('region', { name: "Confirmation de l'adresse e-mail" })
    expect(banner).toHaveTextContent('Confirmez votre adresse : un lien a été envoyé à lea@exemple.fr.')
    expect(document.documentElement.style.getPropertyValue('--notice-height')).toMatch(/px$/)

    await user.click(within(banner).getByRole('button', { name: 'Renvoyer le lien' }))
    expect(await screen.findByText('Nouveau lien envoyé à lea@exemple.fr')).toBeInTheDocument()
    expect(calls).toBe(1)
  })

  it('says when a link was sent too recently', async () => {
    server.use(
      http.get(apiUrl('/v1/me'), () => HttpResponse.json(unverified)),
      http.post(apiUrl('/v1/me/verification-email'), () => problem(429)),
    )
    const { user } = renderRoutes(routes, { path: '/profil' })

    await user.click(await screen.findByRole('button', { name: 'Renvoyer le lien' }))
    expect(await screen.findByText('Un lien vient d’être envoyé. Réessayez dans une minute.')).toBeInTheDocument()
  })

  it('hides until the tab is closed with « Plus tard »', async () => {
    server.use(http.get(apiUrl('/v1/me'), () => HttpResponse.json(unverified)))
    const { user } = renderRoutes(routes, { path: '/profil' })

    await user.click(await screen.findByRole('button', { name: 'Plus tard' }))
    expect(screen.queryByRole('region', { name: "Confirmation de l'adresse e-mail" })).not.toBeInTheDocument()
    expect(sessionStorage.getItem('swipread.verifyBanner.dismissed')).toBe('1')
    expect(document.documentElement.style.getPropertyValue('--notice-height')).toBe('')
  })
})

describe('verify email page', () => {
  it('confirms the address once, without a session', async () => {
    const sent: unknown[] = []
    server.use(
      http.post(apiUrl('/v1/auth/email/verify'), async ({ request }) => {
        sent.push({ body: await request.json(), authorization: request.headers.get('Authorization') })
        return new HttpResponse(null, { status: 204 })
      }),
    )
    renderRoutes(routes, { path: '/verifier-email?token=abc_DEF-123' })

    expect(await screen.findByRole('heading', { name: 'Adresse confirmée' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/connexion')
    expect(sent).toEqual([{ body: { token: 'abc_DEF-123' }, authorization: null }])
  })

  it('leads a signed-in reader back to the app and refreshes their profile', async () => {
    session.save(token)
    server.use(http.post(apiUrl('/v1/auth/email/verify'), () => new HttpResponse(null, { status: 204 })))
    const { queryClient } = renderRoutes(routes, { path: '/verifier-email?token=abc' })
    queryClient.setQueryData(['me'], unverified)

    expect(await screen.findByRole('link', { name: 'Continuer vers Swipread' })).toHaveAttribute('href', '/')
    await waitFor(() => expect(queryClient.getQueryState(['me'])?.isInvalidated).toBe(true))
  })

  it('explains an invalid link and offers a new one to a signed-in reader', async () => {
    session.save(token)
    let resent = 0
    server.use(
      http.post(apiUrl('/v1/auth/email/verify'), () => problem(400)),
      http.post(apiUrl('/v1/me/verification-email'), () => {
        resent += 1
        return new HttpResponse(null, { status: 202 })
      }),
    )
    const { user } = renderRoutes(routes, { path: '/verifier-email?token=old' })

    expect(await screen.findByRole('heading', { name: 'Ce lien n’est plus valable' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Recevoir un nouveau lien' }))
    expect(await screen.findByRole('button', { name: 'Lien envoyé' })).toBeDisabled()
    expect(resent).toBe(1)
  })

  it('asks a signed-out reader to log in for a new link, and needs a token', async () => {
    renderRoutes(routes, { path: '/verifier-email' })

    expect(await screen.findByRole('heading', { name: 'Ce lien n’est plus valable' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/connexion')
  })
})
