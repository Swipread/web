import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { historyItem, token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'
import type { TrackedEvent } from '../tracking/eventQueue'
import { tracker } from '../tracking/tracker'

// Tuesday 13 October 2026, 15:30 local time.
const now = new Date(2026, 9, 13, 15, 30)
const at = (day: number, hours: number, minutes = 0) => new Date(2026, 9, day, hours, minutes).toISOString()

function serveHistory(...items: ReturnType<typeof historyItem>[]) {
  server.use(http.get(apiUrl('/v1/me/history'), () => HttpResponse.json({ items })))
}

describe('reading history', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(now)
    // After setting the clock, so the session does not look expired.
    session.save(token)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('groups articles by when they were read', async () => {
    serveHistory(
      historyItem({ title: 'Les batteries solides' }, at(13, 10, 12)),
      historyItem({ title: 'Le Tour de France' }, at(13, 9, 40)),
      historyItem({ title: 'La sonde Juice' }, at(12, 18)),
      historyItem({ title: 'Les micro-forêts' }, at(11, 8)),
      historyItem({ title: 'Les premiers jeux vidéo' }, at(1, 8)),
    )
    renderRoutes(routes, { path: '/historique' })

    const today = await screen.findByRole('region', { name: "Aujourd'hui" })
    const week = screen.getByRole('region', { name: 'Cette semaine' })
    const older = screen.getByRole('region', { name: 'Plus ancien' })
    const titles = (region: HTMLElement) =>
      within(region)
        .getAllByRole('heading', { level: 3 })
        .map((heading) => heading.textContent?.replace(' (nouvel onglet)', ''))
    expect(titles(today)).toEqual(['Les batteries solides', 'Le Tour de France'])
    expect(titles(week)).toEqual(['La sonde Juice', 'Les micro-forêts'])
    expect(titles(older)).toEqual(['Les premiers jeux vidéo'])
    expect(within(today).getByText('Lu à 10 h 12')).toBeInTheDocument()
    expect(within(week).getByText('Lu hier')).toBeInTheDocument()
    expect(within(week).getByText('Lu dimanche')).toBeInTheDocument()
    expect(within(older).getByText('Lu le 1 oct.')).toBeInTheDocument()
  })

  it('reopens an article and records it', async () => {
    const item = historyItem({ title: 'La sonde Juice' }, at(13, 10))
    serveHistory(item)
    const events: TrackedEvent[] = []
    server.use(
      http.post(apiUrl('/v1/events'), async ({ request }) => {
        events.push(...((await request.json()) as { events: TrackedEvent[] }).events)
        return HttpResponse.json({ accepted: 1, duplicates: 0 }, { status: 202 })
      }),
    )
    const { user } = renderRoutes(routes, { path: '/historique' })

    const reread = await screen.findByRole('link', { name: 'Relire « La sonde Juice » (nouvel onglet)' })
    expect(reread).toHaveAttribute('href', item.article.url)
    expect(reread).toHaveAttribute('target', '_blank')
    await user.click(reread)
    await tracker.flush()

    expect(events).toMatchObject([{ type: 'open', articleId: item.article.id }])
  })

  it('loads more with the cursor', async () => {
    const cursors: (string | null)[] = []
    server.use(
      http.get(apiUrl('/v1/me/history'), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        cursors.push(cursor)
        return HttpResponse.json(
          cursor
            ? { items: [historyItem({ title: 'Plus ancien article' }, at(2, 8))] }
            : { items: [historyItem({}, at(13, 8))], nextCursor: 'c_2' },
        )
      }),
    )
    const { user } = renderRoutes(routes, { path: '/historique' })

    await user.click(await screen.findByRole('button', { name: 'Charger plus' }))

    expect(await screen.findByRole('link', { name: /^Plus ancien article/ })).toBeInTheDocument()
    expect(cursors).toEqual([null, 'c_2'])
  })

  it('shows an empty state', async () => {
    serveHistory()
    renderRoutes(routes, { path: '/historique' })

    expect(await screen.findByText('Aucun article lu pour le moment')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Parcourir mon fil' })).toHaveAttribute('href', '/')
  })

  it('offers a retry on error', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/me/history'), () =>
        ++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json({ items: [historyItem()] }),
      ),
    )
    const { user } = renderRoutes(routes, { path: '/historique' })

    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
  })

  it('is reachable from the navigation', async () => {
    const { user } = renderRoutes(routes, { path: '/sauvegardes' })

    await user.click(await screen.findByRole('link', { name: 'Historique' }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Historique' })).toBeInTheDocument()
  })
})
