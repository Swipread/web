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

  it('clears the session and calls the handler when the refresh is refused too', async () => {
    session.save({ accessToken: 'expired', userId: 'u_1', expiresIn: 3600 })
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    server.use(http.get(apiUrl('/v1/me'), () => HttpResponse.json(unauthorized, { status: 401 })))

    await expect(unwrap(api.GET('/v1/me'))).rejects.toMatchObject({ status: 401 })
    expect(session.get()).toBeNull()
    expect(onUnauthorized).toHaveBeenCalledOnce()
  })

  describe('refresh token', () => {
    const renewed = { accessToken: 'jwt-new', tokenType: 'Bearer', expiresIn: 900, userId: 'u_1' }

    it('renews the access token on 401 and replays the request, body included', async () => {
      session.save({ accessToken: 'jwt-old', userId: 'u_1', expiresIn: 900 })
      const onUnauthorized = vi.fn()
      setUnauthorizedHandler(onUnauthorized)
      const seen: { authorization: string | null; body: unknown }[] = []
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
      server.use(
        http.post(apiUrl('/v1/auth/refresh'), () => HttpResponse.json(renewed)),
        http.put(apiUrl('/v1/me/topics'), async ({ request }) => {
          seen.push({ authorization: request.headers.get('Authorization'), body: await request.json() })
          return seen.length === 1 ? HttpResponse.json(unauthorized, { status: 401 }) : HttpResponse.json([])
        }),
      )

      await unwrap(api.PUT('/v1/me/topics', { body: { topicIds: [1, 2, 3] } }))

      expect(seen).toEqual([
        { authorization: 'Bearer jwt-old', body: { topicIds: [1, 2, 3] } },
        { authorization: 'Bearer jwt-new', body: { topicIds: [1, 2, 3] } },
      ])
      // msw drops `credentials`: check what was handed to fetch instead.
      expect(fetchSpy).toHaveBeenCalledWith(apiUrl('/v1/auth/refresh'), { method: 'POST', credentials: 'include' })
      fetchSpy.mockRestore()
      expect(session.get()?.accessToken).toBe('jwt-new')
      expect(onUnauthorized).not.toHaveBeenCalled()
    })

    it('renews only once for simultaneous 401s', async () => {
      session.save({ accessToken: 'jwt-old', userId: 'u_1', expiresIn: 900 })
      let refreshes = 0
      server.use(
        http.post(apiUrl('/v1/auth/refresh'), async () => {
          refreshes += 1
          await new Promise((resolve) => setTimeout(resolve, 20))
          return HttpResponse.json(renewed)
        }),
        http.get(apiUrl('/v1/topics'), ({ request }) =>
          request.headers.get('Authorization') === 'Bearer jwt-new'
            ? HttpResponse.json([])
            : HttpResponse.json(unauthorized, { status: 401 }),
        ),
      )

      await Promise.all([unwrap(api.GET('/v1/topics')), unwrap(api.GET('/v1/topics')), unwrap(api.GET('/v1/topics'))])

      expect(refreshes).toBe(1)
    })

    it('renews before sending when the token is about to expire', async () => {
      session.save({ accessToken: 'jwt-old', userId: 'u_1', expiresIn: 30 })
      let authorization: string | null = null
      server.use(
        http.post(apiUrl('/v1/auth/refresh'), () => HttpResponse.json(renewed)),
        http.get(apiUrl('/v1/topics'), ({ request }) => {
          authorization = request.headers.get('Authorization')
          return HttpResponse.json([])
        }),
      )

      await unwrap(api.GET('/v1/topics'))

      expect(authorization).toBe('Bearer jwt-new')
    })

    it('keeps the session when the refresh cannot reach the server', async () => {
      session.save({ accessToken: 'jwt-old', userId: 'u_1', expiresIn: 900 })
      const onUnauthorized = vi.fn()
      setUnauthorizedHandler(onUnauthorized)
      server.use(
        http.post(apiUrl('/v1/auth/refresh'), () => HttpResponse.error()),
        http.get(apiUrl('/v1/me'), () => HttpResponse.json(unauthorized, { status: 401 })),
      )

      await expect(unwrap(api.GET('/v1/me'))).rejects.toMatchObject({ status: 0 })
      expect(session.get()?.accessToken).toBe('jwt-old')
      expect(onUnauthorized).not.toHaveBeenCalled()
    })

    it('sends the refresh token cookie with login', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch')
      server.use(http.post(apiUrl('/v1/auth/login'), () => HttpResponse.json(renewed)))

      await unwrap(api.POST('/v1/auth/login', { body: { email: 'a@b.fr', password: 'password123' } }))

      const sent = fetchSpy.mock.calls[0][0] as Request
      expect(sent.url).toBe(apiUrl('/v1/auth/login'))
      expect(sent.credentials).toBe('include')
      fetchSpy.mockRestore()
    })
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
