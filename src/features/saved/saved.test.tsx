import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { feedItem, savedItem, token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'
import type { TrackedEvent } from '../tracking/eventQueue'
import { tracker } from '../tracking/tracker'

describe('saved articles', () => {
  beforeEach(() => {
    session.save(token)
  })

  it('lists saved articles, most recent first, with when they were saved', async () => {
    const first = savedItem({ title: 'Les batteries solides', sourceName: 'Le Journal Tech' })
    const second = savedItem({ title: 'La sonde Juice' })
    server.use(http.get(apiUrl('/v1/me/saved'), () => HttpResponse.json({ items: [first, second] })))
    renderRoutes(routes, { path: '/sauvegardes' })

    const rows = await screen.findAllByRole('article')
    expect(rows.map((row) => within(row).getByRole('heading').textContent)).toEqual([
      'Les batteries solides (nouvel onglet)',
      'La sonde Juice (nouvel onglet)',
    ])
    expect(screen.getByText('2 articles à lire plus tard')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Sauvegardé hier')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Le Journal Tech')).toBeInTheDocument()

    const link = within(rows[0]).getByRole('link', { name: 'Les batteries solides (nouvel onglet)' })
    expect(link).toHaveAttribute('href', first.article.url)
    expect(link).toHaveAttribute('target', '_blank')
  })

  it('loads more with the cursor', async () => {
    const cursors: (string | null)[] = []
    server.use(
      http.get(apiUrl('/v1/me/saved'), ({ request }) => {
        const cursor = new URL(request.url).searchParams.get('cursor')
        cursors.push(cursor)
        return HttpResponse.json(
          cursor ? { items: [savedItem({ title: 'Plus ancien' })] } : { items: [savedItem()], nextCursor: 'c_2' },
        )
      }),
    )
    const { user } = renderRoutes(routes, { path: '/sauvegardes' })

    await user.click(await screen.findByRole('button', { name: 'Charger plus' }))

    expect(await screen.findByRole('link', { name: /Plus ancien/ })).toBeInTheDocument()
    expect(cursors).toEqual([null, 'c_2'])
    expect(screen.queryByRole('button', { name: 'Charger plus' })).not.toBeInTheDocument()
  })

  it('sends pending events first so a just-saved article shows up', async () => {
    const order: string[] = []
    server.use(
      http.post(apiUrl('/v1/events'), () => {
        order.push('events')
        return HttpResponse.json({ accepted: 1, duplicates: 0 }, { status: 202 })
      }),
      http.get(apiUrl('/v1/me/saved'), () => {
        order.push('saved')
        return HttpResponse.json({ items: [] })
      }),
    )
    tracker.track({ type: 'save', articleId: 'a_42' })
    renderRoutes(routes, { path: '/sauvegardes' })

    expect(await screen.findByText('Aucun article sauvegardé')).toBeInTheDocument()
    expect(order).toEqual(['events', 'saved'])
  })

  it('records opening and sharing an article', async () => {
    const item = savedItem({ title: 'La sonde Juice' })
    const events: TrackedEvent[] = []
    server.use(
      http.get(apiUrl('/v1/me/saved'), () => HttpResponse.json({ items: [item] })),
      http.post(apiUrl('/v1/events'), async ({ request }) => {
        events.push(...((await request.json()) as { events: TrackedEvent[] }).events)
        return HttpResponse.json({ accepted: 1, duplicates: 0 }, { status: 202 })
      }),
    )
    const { user } = renderRoutes(routes, { path: '/sauvegardes' })

    await user.click(await screen.findByRole('link', { name: /La sonde Juice/ }))
    await user.click(screen.getByRole('button', { name: 'Partager « La sonde Juice »' }))
    expect(await screen.findByText('Lien copié')).toBeInTheDocument()
    await tracker.flush()

    expect(events.map(({ type, articleId, payload }) => ({ type, articleId, payload }))).toEqual([
      { type: 'open', articleId: item.article.id, payload: undefined },
      { type: 'share', articleId: item.article.id, payload: { channel: 'clipboard' } },
    ])
  })

  it('removes an article with an unsave event and moves focus to the next one', async () => {
    const [first, second] = [savedItem({ title: 'Les batteries solides' }), savedItem({ title: 'La sonde Juice' })]
    const events: TrackedEvent[] = []
    server.use(
      http.get(apiUrl('/v1/me/saved'), () => HttpResponse.json({ items: [first, second] })),
      http.post(apiUrl('/v1/events'), async ({ request }) => {
        events.push(...((await request.json()) as { events: TrackedEvent[] }).events)
        return HttpResponse.json({ accepted: 1, duplicates: 0 }, { status: 202 })
      }),
    )
    const { user } = renderRoutes(routes, { path: '/sauvegardes' })

    await user.click(await screen.findByRole('button', { name: 'Retirer « Les batteries solides » des sauvegardés' }))

    expect(screen.queryByRole('link', { name: /Les batteries solides/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /La sonde Juice/ })).toHaveFocus()
    expect(screen.getByText('1 article à lire plus tard')).toBeInTheDocument()
    expect(screen.getByText('Article retiré des sauvegardés')).toBeInTheDocument()
    await tracker.flush()
    expect(events).toMatchObject([{ type: 'unsave', articleId: first.article.id }])
  })

  it('shows the empty state once the last article is removed', async () => {
    server.use(http.get(apiUrl('/v1/me/saved'), () => HttpResponse.json({ items: [savedItem({ title: 'Seul' })] })))
    const { user } = renderRoutes(routes, { path: '/sauvegardes' })

    await user.click(await screen.findByRole('button', { name: /^Retirer/ }))

    expect(screen.getByText('Aucun article sauvegardé')).toBeInTheDocument()
  })

  it('unmarks the article in the cached feed', async () => {
    const item = feedItem({ title: 'Les batteries solides', saved: true })
    const { articleId, title, url } = item
    server.use(
      http.get(apiUrl('/v1/feed'), () => HttpResponse.json({ items: [item] })),
      http.get(apiUrl('/v1/me/saved'), () =>
        HttpResponse.json({ items: [{ ...savedItem(), article: { id: articleId, title, url } }] }),
      ),
    )
    const { user } = renderRoutes(routes)
    await screen.findByRole('article', { name: title })

    await user.click(screen.getByRole('link', { name: 'Sauvegardés' }))
    await user.click(await screen.findByRole('button', { name: /^Retirer/ }))
    await user.click(screen.getByRole('link', { name: 'Pour vous' }))

    const card = await screen.findByRole('article', { name: title })
    expect(within(card).getByRole('button', { name: 'Sauvegarder' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('offers a retry on error', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/me/saved'), () =>
        ++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json({ items: [savedItem()] }),
      ),
    )
    const { user } = renderRoutes(routes, { path: '/sauvegardes' })

    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))
  })
})
