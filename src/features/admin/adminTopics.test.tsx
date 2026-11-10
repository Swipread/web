import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { admin, adminTopics, token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

function renderTopics() {
  return renderRoutes(routes, { path: '/admin/themes' })
}

const rowOf = async (label: string) => (await screen.findByRole('rowheader', { name: label })).closest('tr')!

describe('admin topics', () => {
  beforeEach(() => {
    session.save(token)
    server.use(http.get(apiUrl('/v1/me'), () => HttpResponse.json(admin)))
  })

  it('lists topics with their counts', async () => {
    renderTopics()
    const row = await rowOf('Technologie')
    const cells = within(row).getAllByRole('cell')
    expect(cells[0].textContent?.replace(/\s/g, ' ')).toBe('1 284')
    expect(cells[1]).toHaveTextContent('312')
    expect(within(row).getByRole('button', { name: 'Renommer Technologie' })).toBeInTheDocument()
  })

  it('shows an empty state', async () => {
    server.use(http.get(apiUrl('/v1/admin/topics'), () => HttpResponse.json([])))
    renderTopics()
    expect(await screen.findByText('Aucun thème')).toBeInTheDocument()
  })

  it('offers a retry when the list fails to load', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/admin/topics'), () =>
        ++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(adminTopics),
      ),
    )
    const { user } = renderTopics()
    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    expect(await rowOf('Science')).toBeInTheDocument()
  })

  it('creates a topic and refreshes the reader topics', async () => {
    let sent: unknown
    server.use(
      http.post(apiUrl('/v1/admin/topics'), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(
          { id: 9, slug: 'jeux-video', label: 'Jeux vidéo', articleCount: 0, readerCount: 0 },
          { status: 201 },
        )
      }),
    )
    const { user, queryClient } = renderTopics()
    queryClient.setQueryData(['topics'], [])

    await user.type(await screen.findByLabelText('Nouveau thème'), '  Jeux vidéo ')
    await user.click(screen.getByRole('button', { name: 'Créer le thème' }))

    expect(await screen.findByText('Thème « Jeux vidéo » créé')).toBeInTheDocument()
    expect(sent).toEqual({ label: 'Jeux vidéo' })
    expect(screen.getByLabelText('Nouveau thème')).toHaveValue('')
    const labels = screen.getAllByRole('rowheader').map((cell) => cell.textContent)
    expect(labels).toEqual(['Culture', 'Jeux vidéo', 'Science', 'Technologie'])
    expect(queryClient.getQueryState(['topics'])?.isInvalidated).toBe(true)
  })

  it('reports a topic that already exists (409)', async () => {
    server.use(http.post(apiUrl('/v1/admin/topics'), () => new HttpResponse(null, { status: 409 })))
    const { user } = renderTopics()
    await user.type(await screen.findByLabelText('Nouveau thème'), 'science')
    await user.click(screen.getByRole('button', { name: 'Créer le thème' }))
    expect(await screen.findByText(/Ce thème existe déjà/)).toBeInTheDocument()
  })

  it('requires a letter or a digit', async () => {
    const { user } = renderTopics()
    await user.type(await screen.findByLabelText('Nouveau thème'), '---')
    await user.click(screen.getByRole('button', { name: 'Créer le thème' }))
    expect(await screen.findByText('Le nom doit contenir au moins une lettre ou un chiffre.')).toBeInTheDocument()
  })

  describe('rename', () => {
    it('renames a topic in place', async () => {
      let sent: unknown
      server.use(
        http.patch(apiUrl('/v1/admin/topics/1'), async ({ request }) => {
          sent = await request.json()
          return HttpResponse.json({ ...adminTopics[2], label: 'Tech' })
        }),
      )
      const { user } = renderTopics()
      await user.click(await screen.findByRole('button', { name: 'Renommer Technologie' }))

      const input = screen.getByLabelText('Nouveau nom de Technologie')
      expect(input).toHaveFocus()
      await user.clear(input)
      await user.type(input, 'Tech{Enter}')

      expect(await screen.findByText('Thème renommé en « Tech »')).toBeInTheDocument()
      expect(sent).toEqual({ label: 'Tech' })
      expect(await screen.findByRole('button', { name: 'Renommer Tech' })).toHaveFocus()
    })

    it('cancels with Escape', async () => {
      const { user } = renderTopics()
      await user.click(await screen.findByRole('button', { name: 'Renommer Science' }))
      await user.type(screen.getByLabelText('Nouveau nom de Science'), 'x{Escape}')

      await waitFor(() => expect(screen.getByRole('button', { name: 'Renommer Science' })).toHaveFocus())
      expect(screen.getByRole('rowheader', { name: 'Science' })).toBeInTheDocument()
    })

    it('keeps the form open on a conflict', async () => {
      server.use(http.patch(apiUrl('/v1/admin/topics/2'), () => new HttpResponse(null, { status: 409 })))
      const { user } = renderTopics()
      await user.click(await screen.findByRole('button', { name: 'Renommer Science' }))
      const input = screen.getByLabelText('Nouveau nom de Science')
      await user.clear(input)
      await user.type(input, 'Culture{Enter}')

      expect(await screen.findByText(/Ce thème existe déjà/)).toBeInTheDocument()
      expect(input).toHaveAttribute('aria-invalid', 'true')
    })
  })
})
