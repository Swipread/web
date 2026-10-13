import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { feedItem, token } from '../../test/fixtures'
import { setVisible } from '../../test/intersectionObserver'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'
import type { TrackedEvent } from './eventQueue'
import { tracker } from './tracker'

type Batch = { sessionId: string; events: TrackedEvent[] }

const slide = (index: number) => document.querySelector<HTMLElement>(`[data-index="${index}"]`)!

function setTabVisible(visible: boolean) {
  vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(visible ? 'visible' : 'hidden')
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('feed tracking', () => {
  const items = [
    feedItem({ requestId: 'r_7', position: 0 }),
    feedItem({ requestId: 'r_7', position: 1 }),
    feedItem({ requestId: 'r_7', position: 2 }),
  ]
  let batches: Batch[]
  let authorizations: (string | null)[]
  let clock: number

  const sentEvents = () => batches.flatMap((batch) => batch.events)
  const sent = () => sentEvents().map(({ type, articleId, payload }) => ({ type, articleId, payload }))

  beforeEach(() => {
    session.save(token)
    batches = []
    authorizations = []
    clock = 0
    vi.spyOn(performance, 'now').mockImplementation(() => clock)
    server.use(
      http.get(apiUrl('/v1/feed'), () => HttpResponse.json({ items })),
      http.post(apiUrl('/v1/events'), async ({ request }) => {
        authorizations.push(request.headers.get('Authorization'))
        batches.push((await request.json()) as Batch)
        return HttpResponse.json({ accepted: 1, duplicates: 0 }, { status: 202 })
      }),
    )
  })

  async function renderFeed() {
    const result = renderRoutes(routes)
    await screen.findByRole('article', { name: items[0].title })
    return result
  }

  it('records impressions and dwell time per card', async () => {
    await renderFeed()

    setVisible(slide(0))
    clock = 4200
    setVisible(slide(1))
    await tracker.flush()

    expect(sent()).toEqual([
      { type: 'impression', articleId: items[0].articleId, payload: undefined },
      { type: 'view', articleId: items[0].articleId, payload: { dwellMs: 4200 } },
      { type: 'impression', articleId: items[1].articleId, payload: undefined },
    ])
    expect(sentEvents()[0]).toMatchObject({ requestId: 'r_7', position: 0 })
    expect(batches[0].sessionId).toMatch(/^s_/)
    expect(authorizations[0]).toBe('Bearer jwt-test')
  })

  it('records an impression only once per card', async () => {
    await renderFeed()

    setVisible(slide(0))
    setVisible(slide(1))
    setVisible(slide(0))
    await tracker.flush()

    expect(sent().filter((e) => e.type === 'impression')).toHaveLength(2)
  })

  it('does not count time spent with the tab hidden', async () => {
    await renderFeed()

    setVisible(slide(0))
    clock = 1000
    setTabVisible(false)
    clock = 60_000
    setTabVisible(true)
    clock = 61_500
    setVisible(slide(1))
    await tracker.flush()

    expect(sent()).toContainEqual({ type: 'view', articleId: items[0].articleId, payload: { dwellMs: 2500 } })
  })

  it('records open, then read time when the reader comes back', async () => {
    const { user } = await renderFeed()
    setVisible(slide(0))
    const card = screen.getByRole('article', { name: items[0].title })

    await user.click(within(card).getByRole('link', { name: /Lire l'article/ }))
    clock = 2000
    setTabVisible(false)
    clock = 92_000
    setTabVisible(true)
    await tracker.flush()

    expect(sent()).toContainEqual({ type: 'open', articleId: items[0].articleId, payload: undefined })
    expect(sent()).toContainEqual({ type: 'read', articleId: items[0].articleId, payload: { readMs: 90_000 } })
  })

  it('records like, unlike, save, unsave and hide', async () => {
    const { user } = await renderFeed()
    setVisible(slide(0))
    const card = screen.getByRole('article', { name: items[0].title })

    await user.click(within(card).getByRole('button', { name: "J'aime" }))
    await user.click(within(card).getByRole('button', { name: "J'aime" }))
    await user.click(within(card).getByRole('button', { name: 'Sauvegarder' }))
    await user.click(within(card).getByRole('button', { name: 'Sauvegarder' }))
    await user.click(within(card).getByRole('button', { name: 'Pas intéressé' }))
    await tracker.flush()

    const types = sent()
      .filter((e) => e.articleId === items[0].articleId)
      .map((e) => e.type)
    expect(types).toEqual(['impression', 'like', 'unlike', 'save', 'unsave', 'hide', 'view'])
    // The next card takes the hidden one's place.
    expect(sent().at(-1)).toMatchObject({ type: 'impression', articleId: items[1].articleId })
  })

  it('sends pending events with the token on logout', async () => {
    const { user, router } = await renderFeed()
    setVisible(slide(0))

    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }))

    await waitFor(() => expect(router.state.location.pathname).toBe('/connexion'))
    await waitFor(() => expect(sent().map((e) => e.type)).toEqual(['impression', 'view']))
    expect(authorizations).toEqual(['Bearer jwt-test'])
  })
})

describe('sharing from the feed', () => {
  const item = feedItem()
  let events: TrackedEvent[]

  beforeEach(() => {
    session.save(token)
    events = []
    server.use(
      http.get(apiUrl('/v1/feed'), () => HttpResponse.json({ items: [item] })),
      http.post(apiUrl('/v1/events'), async ({ request }) => {
        events.push(...((await request.json()) as Batch).events)
        return HttpResponse.json({ accepted: 1, duplicates: 0 }, { status: 202 })
      }),
    )
  })

  it('copies the link, confirms it and records the share', async () => {
    const { user } = renderRoutes(routes)
    const card = await screen.findByRole('article', { name: item.title })

    await user.click(within(card).getByRole('button', { name: 'Partager' }))

    expect(await screen.findByRole('status', { name: 'Notifications' })).toHaveTextContent('Lien copié')
    await expect(navigator.clipboard.readText()).resolves.toBe(item.url)
    await tracker.flush()
    expect(events).toContainEqual(
      expect.objectContaining({ type: 'share', articleId: item.articleId, payload: { channel: 'clipboard' } }),
    )
  })

  it('records nothing when the share sheet is dismissed', async () => {
    Object.defineProperty(navigator, 'share', {
      value: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')),
      configurable: true,
    })
    const { user } = renderRoutes(routes)
    const card = await screen.findByRole('article', { name: item.title })

    await user.click(within(card).getByRole('button', { name: 'Partager' }))
    await tracker.flush()

    expect(events.some((e) => e.type === 'share')).toBe(false)
    expect(screen.getByRole('status', { name: 'Notifications' })).toBeEmptyDOMElement()
    delete (navigator as unknown as Record<string, unknown>).share
  })
})
