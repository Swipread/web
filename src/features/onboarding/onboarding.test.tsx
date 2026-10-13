import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { me, token, topics } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

describe('onboarding', () => {
  let sent: unknown

  beforeEach(() => {
    session.save(token)
    sent = undefined
    let chosen: typeof topics = []
    server.use(
      http.get(apiUrl('/v1/me'), () => HttpResponse.json({ ...me, topics: chosen })),
      http.put(apiUrl('/v1/me/topics'), async ({ request }) => {
        sent = await request.json()
        const { topicIds } = sent as { topicIds: number[] }
        chosen = topics.filter((t) => topicIds.includes(t.id!))
        return HttpResponse.json(chosen)
      }),
    )
  })

  it('blocks validation until 3 topics are chosen', async () => {
    const { user } = renderRoutes(routes, { path: '/centres-interet' })
    const submit = await screen.findByRole('button', { name: 'Continuer vers mon fil' })

    expect(submit).toBeDisabled()
    expect(screen.getByText('Aucun thème sélectionné · encore 3 à choisir')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Technologie' }))
    await user.click(screen.getByRole('button', { name: 'Science' }))
    expect(screen.getByText('2 thèmes sélectionnés · encore 1 à choisir')).toBeInTheDocument()
    expect(submit).toBeDisabled()

    await user.click(screen.getByRole('button', { name: 'Culture' }))
    expect(screen.getByRole('button', { name: 'Culture' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('3 thèmes sélectionnés')).toBeInTheDocument()
    expect(submit).toBeEnabled()

    await user.click(screen.getByRole('button', { name: 'Culture' }))
    expect(submit).toBeDisabled()
  })

  it('saves the topics and opens the feed', async () => {
    const { user, router } = renderRoutes(routes, { path: '/centres-interet' })

    for (const label of ['Technologie', 'Science', 'Sport']) {
      await user.click(await screen.findByRole('button', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: 'Continuer vers mon fil' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(sent).toEqual({ topicIds: [1, 2, 4] })
    expect(await screen.findByRole('heading', { name: 'Pour vous' })).toBeInTheDocument()
  })

  it('shows an error when saving fails', async () => {
    server.use(http.put(apiUrl('/v1/me/topics'), () => new HttpResponse(null, { status: 500 })))
    const { user } = renderRoutes(routes, { path: '/centres-interet' })

    for (const label of ['Technologie', 'Science', 'Sport']) {
      await user.click(await screen.findByRole('button', { name: label }))
    }
    await user.click(screen.getByRole('button', { name: 'Continuer vers mon fil' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('momentanément indisponible')
  })

  it('offers a retry when topics fail to load', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/topics'), () =>
        ++calls === 1 ? new HttpResponse(null, { status: 503 }) : HttpResponse.json(topics),
      ),
    )
    const { user } = renderRoutes(routes, { path: '/centres-interet' })

    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('button', { name: 'Technologie' })).toBeInTheDocument()
  })

  it('explains when no topic exists', async () => {
    server.use(http.get(apiUrl('/v1/topics'), () => HttpResponse.json([])))
    renderRoutes(routes, { path: '/centres-interet' })
    expect(await screen.findByText('Aucun thème disponible')).toBeInTheDocument()
  })
})
