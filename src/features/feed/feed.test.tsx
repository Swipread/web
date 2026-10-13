import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { feedItem, token } from '../../test/fixtures'
import { setVisible } from '../../test/intersectionObserver'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

type Item = ReturnType<typeof feedItem>

function serveFeed(...pages: Item[][]) {
  const calls: Request[] = []
  server.use(
    http.get(apiUrl('/v1/feed'), ({ request }) => {
      calls.push(request)
      return HttpResponse.json({ items: pages[calls.length - 1] ?? [] })
    }),
  )
  return calls
}

const cards = () => screen.getAllByRole('article')
const slide = (index: number) => document.querySelector<HTMLElement>(`[data-index="${index}"]`)!

describe('feed', () => {
  beforeEach(() => {
    session.save(token)
  })

  it('shows each article with its source, date and reading time', async () => {
    const item = feedItem({ title: 'Les batteries solides', sourceName: 'Le Journal Tech', wordCount: 1380 })
    const calls = serveFeed([item])
    renderRoutes(routes)

    const card = await screen.findByRole('article', { name: 'Les batteries solides' })
    expect(within(card).getByText('Le Journal Tech')).toBeInTheDocument()
    expect(within(card).getByText('Il y a 2 h', { normalizer: (t) => t.replace(/\s/g, ' ') })).toBeInTheDocument()
    expect(within(card).getByText('6 min de lecture')).toBeInTheDocument()

    const link = within(card).getByRole('link', { name: "Lire l'article (nouvel onglet)" })
    expect(link).toHaveAttribute('href', item.url)
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    expect(calls[0].headers.get('X-Session-Id')).toMatch(/^s_/)
    expect(calls[0].headers.get('X-Device')).toBe('desktop')
  })

  it('loads the next page before reaching the end', async () => {
    const first = Array.from({ length: 5 }, () => feedItem())
    const second = Array.from({ length: 5 }, () => feedItem())
    const calls = serveFeed(first, second)
    renderRoutes(routes)
    await screen.findByRole('article', { name: first[0].title })

    setVisible(slide(0))
    expect(calls).toHaveLength(1)

    // 3 cards remain below the second one.
    setVisible(slide(1))
    await waitFor(() => expect(cards()).toHaveLength(10))
    expect(calls).toHaveLength(2)
  })

  it('moves between cards with the arrow keys', async () => {
    serveFeed(Array.from({ length: 5 }, () => feedItem()))
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoutes(routes)
    await screen.findAllByRole('article')
    setVisible(slide(0))

    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(scrollIntoView.mock.contexts.at(-1)).toBe(slide(1))
    expect(slide(1)).toHaveFocus()

    // A second press before the scroll settles keeps going forward.
    fireEvent.keyDown(document.body, { key: 'ArrowDown' })
    expect(slide(2)).toHaveFocus()

    setVisible(slide(2))
    fireEvent.keyDown(document.body, { key: 'ArrowUp' })
    expect(slide(1)).toHaveFocus()
  })

  it('ignores arrow keys while typing in a field', async () => {
    serveFeed([feedItem(), feedItem()])
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoutes(routes)
    await screen.findAllByRole('article')

    const input = document.createElement('input')
    document.body.append(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    expect(scrollIntoView).not.toHaveBeenCalled()
    input.remove()
  })

  it('removes a card marked as not interesting and focuses the next one', async () => {
    const [first, second] = [feedItem(), feedItem()]
    serveFeed([first, second, feedItem()])
    const { user } = renderRoutes(routes)
    const card = await screen.findByRole('article', { name: first.title })

    await user.click(within(card).getByRole('button', { name: 'Pas intéressé' }))

    expect(screen.queryByRole('article', { name: first.title })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: second.title })).toHaveFocus()
  })

  it('toggles like and marks the article as saved', async () => {
    const item = feedItem()
    serveFeed([item])
    const { user } = renderRoutes(routes)
    const card = await screen.findByRole('article', { name: item.title })

    const like = within(card).getByRole('button', { name: "J'aime" })
    await user.click(like)
    expect(like).toHaveAttribute('aria-pressed', 'true')
    await user.click(like)
    expect(like).toHaveAttribute('aria-pressed', 'false')

    await user.click(within(card).getByRole('button', { name: 'Sauvegarder' }))
    expect(within(card).getByRole('button', { name: 'Sauvegardé' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('reopens on the card left last time', async () => {
    const items = Array.from({ length: 4 }, () => feedItem())
    serveFeed(items)
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    sessionStorage.setItem('swipread.feed.articleId', items[2].articleId!)
    renderRoutes(routes)
    await screen.findAllByRole('article')

    expect(scrollIntoView.mock.contexts[0]).toBe(slide(2))
  })

  it('remembers the card on screen', async () => {
    const items = [feedItem(), feedItem()]
    serveFeed(items)
    renderRoutes(routes)
    await screen.findAllByRole('article')

    setVisible(slide(1))
    expect(sessionStorage.getItem('swipread.feed.articleId')).toBe(items[1].articleId)
  })

  it('offers a retry when the feed fails to load', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/feed'), () =>
        ++calls === 1 ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ items: [feedItem()] }),
      ),
    )
    const { user } = renderRoutes(routes)

    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    expect((await screen.findAllByRole('article')).length).toBeGreaterThan(0)
  })

  it('explains an empty feed', async () => {
    serveFeed([])
    renderRoutes(routes)
    expect(await screen.findByText('Votre fil est vide pour le moment')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: "Modifier mes centres d'intérêt" })).toHaveAttribute('href', '/profil')
  })

  it('tells the reader when there is nothing left', async () => {
    serveFeed([feedItem()], [])
    renderRoutes(routes)
    await screen.findByRole('article')
    setVisible(slide(0))
    expect(await screen.findByText('Vous êtes à jour')).toBeInTheDocument()
  })
})
