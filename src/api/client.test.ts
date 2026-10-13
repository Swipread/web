import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { session } from '../lib/session'
import { apiUrl, server } from '../test/server'
import { api, setUnauthorizedHandler, unwrap } from './client'
import { ApiError } from './problem'

const unauthorized = { status: 401, title: 'Unauthorized', detail: 'Missing or invalid access token' }

describe('api client', () => {
  it('sends the JWT on authenticated requests', async () => {
    session.save({ accessToken: 'jwt-123', userId: 'u_1', expiresIn: 3600 })
    let authorization: string | null = null
    server.use(
      http.get(apiUrl('/v1/topics'), ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json([{ id: 1, slug: 'science', label: 'Science' }])
      }),
    )

    const topics = await unwrap(api.GET('/v1/topics'))

    expect(authorization).toBe('Bearer jwt-123')
    expect(topics).toEqual([{ id: 1, slug: 'science', label: 'Science' }])
  })

  it('clears the session and calls the handler on 401', async () => {
    session.save({ accessToken: 'expired', userId: 'u_1', expiresIn: 3600 })
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    server.use(http.get(apiUrl('/v1/me'), () => HttpResponse.json(unauthorized, { status: 401 })))

    await expect(unwrap(api.GET('/v1/me'))).rejects.toMatchObject({ status: 401 })
    expect(session.get()).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  it('treats 401 on login as wrong credentials, not an expired session', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    let authorization: string | null = 'unset'
    server.use(
      http.post(apiUrl('/v1/auth/login'), ({ request }) => {
        authorization = request.headers.get('Authorization')
        return HttpResponse.json(
          { status: 401, title: 'Unauthorized', detail: 'Invalid email or password' },
          { status: 401, headers: { 'Content-Type': 'application/problem+json' } },
        )
      }),
    )

    const request = unwrap(api.POST('/v1/auth/login', { body: { email: 'a@b.fr', password: 'x' } }))

    await expect(request).rejects.toBeInstanceOf(ApiError)
    expect(authorization).toBeNull()
    expect(onUnauthorized).not.toHaveBeenCalled()
  })

  it('turns a network failure into an ApiError with status 0', async () => {
    server.use(http.get(apiUrl('/v1/topics'), () => HttpResponse.error()))

    await expect(unwrap(api.GET('/v1/topics'))).rejects.toMatchObject({
      status: 0,
      message: 'Impossible de joindre le serveur. Vérifiez votre connexion.',
    })
  })
})
