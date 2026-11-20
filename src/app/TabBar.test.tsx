import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '../test/render'
import { TabBar } from './TabBar'

describe('TabBar', () => {
  it('marks the current page and hides the admin tab for readers', () => {
    renderWithProviders(<TabBar showAdmin={false} tone="paper" />, { path: '/sauvegardes' })
    expect(screen.getByRole('link', { name: 'Sauvegardés' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'Pour vous' })).not.toHaveAttribute('aria-current')
    expect(screen.queryByRole('link', { name: 'Admin' })).not.toBeInTheDocument()
  })

  it('adds one admin tab for administrators, and no logout', () => {
    renderWithProviders(<TabBar showAdmin tone="ambient" />)
    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', '/admin')
    expect(screen.queryByRole('button', { name: 'Se déconnecter' })).not.toBeInTheDocument()
  })
})
