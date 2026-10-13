import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Button } from './Button'
import { Chip } from './Chip'
import { ErrorState } from './ErrorState'
import { IconButton } from './IconButton'
import { TextField } from './TextField'
import { HeartIcon } from './icons'

describe('Button', () => {
  it('is disabled and busy while loading', () => {
    render(<Button loading>Envoyer</Button>)
    const button = screen.getByRole('button', { name: 'Envoyer' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('IconButton', () => {
  it('uses the label as accessible name when the caption is hidden', () => {
    render(<IconButton icon={<HeartIcon />} label="J'aime" pressed={false} />)
    expect(screen.getByRole('button', { name: "J'aime" })).toHaveAttribute('aria-pressed', 'false')
  })

  it('uses the visible caption as accessible name', () => {
    render(<IconButton icon={<HeartIcon />} label="J'aime" showLabel pressed />)
    const button = screen.getByRole('button', { name: "J'aime" })
    expect(button).not.toHaveAttribute('aria-label')
    expect(button).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('TextField', () => {
  it('links label, hint and error to the input', () => {
    const { rerender } = render(<TextField label="Email" hint="Votre adresse" />)
    const input = screen.getByLabelText('Email')
    expect(input).toHaveAccessibleDescription('Votre adresse')
    expect(input).not.toBeInvalid()

    rerender(<TextField label="Email" hint="Votre adresse" error="Email invalide" />)
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('Email invalide')
  })
})

describe('Chip', () => {
  it('exposes its selected state', async () => {
    const onClick = vi.fn()
    render(
      <Chip selected={false} onClick={onClick}>
        Science
      </Chip>,
    )
    await userEvent.click(screen.getByRole('button', { name: 'Science' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'Science' })).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('ErrorState', () => {
  it('announces the error and offers a retry', async () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Le serveur ne répond pas." onRetry={onRetry} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Le serveur ne répond pas.')
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
