import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { routes } from '../../app/routes'
import { session } from '../../lib/session'
import { admin, sources, token } from '../../test/fixtures'
import { renderRoutes } from '../../test/render'
import { apiUrl, server } from '../../test/server'

const problem = (status: number, detail?: string) =>
  HttpResponse.json({ status, title: 'Error', detail }, { status, headers: { 'Content-Type': 'application/problem+json' } })

function renderSources() {
  return renderRoutes(routes, { path: '/admin/sources' })
}

async function fillForm(user: ReturnType<typeof renderSources>['user']) {
  await user.type(await screen.findByLabelText('Nom'), 'Revue Espace')
  await user.type(screen.getByLabelText('URL du site'), 'https://revue-espace.fr')
  await user.type(screen.getByLabelText('URL du flux'), 'https://revue-espace.fr/feed')
}

describe('admin sources', () => {
  beforeEach(() => {
    session.save(token)
    server.use(http.get(apiUrl('/v1/admin/sources'), () => HttpResponse.json(sources)))
    server.use(http.get(apiUrl('/v1/me'), () => HttpResponse.json(admin)))
  })

  it('lists the sources with their status', async () => {
    renderSources()
    const row = (await screen.findByRole('rowheader', { name: 'Le Journal Tech' })).closest('tr')!
    expect(within(row).getByText('https://journaltech.fr/rss')).toBeInTheDocument()
    expect(within(row).getByText('FR')).toBeInTheDocument()
    expect(within(row).getByText('Active')).toBeInTheDocument()
    expect(within(row).getByRole('button', { name: 'Désactiver Le Journal Tech' })).toBeInTheDocument()

    const inactive = screen.getByRole('rowheader', { name: 'Sport Hebdo' }).closest('tr')!
    expect(within(inactive).getByText('Inactive')).toBeInTheDocument()
    expect(within(inactive).getByText('—')).toBeInTheDocument()
  })

  it('shows an empty state and keeps the form', async () => {
    server.use(http.get(apiUrl('/v1/admin/sources'), () => HttpResponse.json([])))
    renderSources()
    expect(await screen.findByText('Aucune source')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Vérifier et ajouter' })).toBeInTheDocument()
  })

  it('offers a retry when the list fails to load', async () => {
    let calls = 0
    server.use(
      http.get(apiUrl('/v1/admin/sources'), () =>
        ++calls === 1 ? new HttpResponse(null, { status: 500 }) : HttpResponse.json(sources),
      ),
    )
    const { user } = renderSources()
    await user.click(await screen.findByRole('button', { name: 'Réessayer' }))
    expect(await screen.findByRole('rowheader', { name: 'Le Journal Tech' })).toBeInTheDocument()
  })

  it('deactivates a source', async () => {
    let sent: unknown
    server.use(
      http.patch(apiUrl('/v1/admin/sources/1'), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json({ ...sources[0], active: false })
      }),
    )
    const { user } = renderSources()
    await user.click(await screen.findByRole('button', { name: 'Désactiver Le Journal Tech' }))

    expect(await screen.findByText('Source désactivée')).toBeInTheDocument()
    expect(sent).toEqual({ active: false })
    expect(screen.getByRole('button', { name: 'Activer Le Journal Tech' })).toBeInTheDocument()
  })

  it('focuses the form from the header button', async () => {
    const { user } = renderSources()
    await user.click(await screen.findByRole('button', { name: 'Ajouter une source' }))
    expect(screen.getByLabelText('Nom')).toHaveFocus()
  })

  it('adds a source after the feed check', async () => {
    let sent: unknown
    server.use(
      http.post(apiUrl('/v1/admin/sources'), async ({ request }) => {
        sent = await request.json()
        return HttpResponse.json(
          { id: 3, ...(sent as object), language: 'fr', active: true },
          { status: 201 },
        )
      }),
    )
    const { user } = renderSources()
    await fillForm(user)
    const language = screen.getByLabelText('Langue')
    await user.clear(language)
    await user.type(language, 'FR')
    await user.click(screen.getByRole('button', { name: 'Vérifier et ajouter' }))

    expect(await screen.findByText('Source « Revue Espace » ajoutée')).toBeInTheDocument()
    // Empty license is left out, language is sent in lowercase.
    expect(sent).toEqual({
      name: 'Revue Espace',
      siteUrl: 'https://revue-espace.fr',
      feedUrl: 'https://revue-espace.fr/feed',
      language: 'fr',
    })
    const names = screen.getAllByRole('rowheader').map((cell) => cell.textContent)
    expect(names).toEqual(['Le Journal Tech', 'Revue Espace', 'Sport Hebdo'])
    expect(screen.getByLabelText('Nom')).toHaveValue('')
  })

  it('validates the form before calling the API', async () => {
    const { user } = renderSources()
    await user.type(await screen.findByLabelText('URL du flux'), 'ftp://exemple.fr/rss')
    await user.click(screen.getByRole('button', { name: 'Vérifier et ajouter' }))

    expect(await screen.findByText('Saisissez le nom de la source.')).toBeInTheDocument()
    expect(screen.getByText("Saisissez l'adresse du site.")).toBeInTheDocument()
    expect(screen.getByText('Saisissez une adresse commençant par http:// ou https://.')).toBeInTheDocument()
  })

  it('explains why the feed was refused (422)', async () => {
    server.use(http.post(apiUrl('/v1/admin/sources'), () => problem(422, 'Feed has no articles')))
    const { user } = renderSources()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Vérifier et ajouter' }))

    expect(await screen.findByText('Le flux ne contient aucun article.')).toBeInTheDocument()
    expect(screen.getByLabelText('URL du flux')).toHaveAttribute('aria-invalid', 'true')
  })

  it('reports a feed already used (409)', async () => {
    server.use(http.post(apiUrl('/v1/admin/sources'), () => problem(409)))
    const { user } = renderSources()
    await fillForm(user)
    await user.click(screen.getByRole('button', { name: 'Vérifier et ajouter' }))
    expect(await screen.findByText('Une source utilise déjà ce flux.')).toBeInTheDocument()
  })

  describe('deletion', () => {
    it('deletes a source without articles after confirmation', async () => {
      server.use(http.delete(apiUrl('/v1/admin/sources/2'), () => new HttpResponse(null, { status: 204 })))
      const { user } = renderSources()
      await user.click(await screen.findByRole('button', { name: 'Supprimer Sport Hebdo' }))

      const dialog = screen.getByRole('dialog', { name: 'Supprimer « Sport Hebdo » ?' })
      await user.click(within(dialog).getByRole('button', { name: 'Supprimer' }))

      expect(await screen.findByText('Source supprimée')).toBeInTheDocument()
      expect(screen.queryByRole('rowheader', { name: 'Sport Hebdo' })).not.toBeInTheDocument()
    })

    it('offers to deactivate a source that has articles (409)', async () => {
      let patched: unknown
      server.use(
        http.delete(apiUrl('/v1/admin/sources/1'), () => problem(409)),
        http.patch(apiUrl('/v1/admin/sources/1'), async ({ request }) => {
          patched = await request.json()
          return HttpResponse.json({ ...sources[0], active: false })
        }),
      )
      const { user } = renderSources()
      await user.click(await screen.findByRole('button', { name: 'Supprimer Le Journal Tech' }))
      await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Supprimer' }))

      const dialog = await screen.findByRole('dialog', { name: 'Cette source a déjà des articles' })
      expect(dialog).toHaveTextContent('Désactivez-la plutôt')
      await user.click(within(dialog).getByRole('button', { name: 'Désactiver la source' }))

      expect(await screen.findByText('Source désactivée')).toBeInTheDocument()
      expect(patched).toEqual({ active: false })
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
      expect(screen.getByRole('rowheader', { name: 'Le Journal Tech' })).toBeInTheDocument()
    })
  })
})
