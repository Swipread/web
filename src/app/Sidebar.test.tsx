import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../test/render'
import { Sidebar } from './Sidebar'

describe('Sidebar', () => {
  it('marks the current page and hides admin links for readers', () => {
    renderWithProviders(<Sidebar showAdmin={false} />, { path: '/sauvegardes' })
    expect(screen.getByRole('link', { name: 'Sauvegardés' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Pour vous' })).not.toHaveAttribute('aria-current')
    expect(screen.queryByRole('link', { name: 'Sources' })).not.toBeInTheDocument()
  })

  it('shows admin links and logout when enabled', async () => {
    const onLogout = vi.fn()
    const { user } = renderWithProviders(<Sidebar showAdmin onLogout={onLogout} />)
    expect(screen.getByRole('link', { name: 'Sources' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Se déconnecter' }))
    expect(onLogout).toHaveBeenCalledOnce()
  })
})
