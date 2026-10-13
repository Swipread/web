import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useToast } from './toastContext'
import { ToastProvider } from './ToastProvider'

function Trigger() {
  const toast = useToast()
  return <button onClick={() => toast.show('Lien copié')}>Copier</button>
}

describe('ToastProvider', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('announces a message and hides it after a few seconds', () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    const region = screen.getByRole('status', { name: 'Notifications' })

    act(() => screen.getByRole('button', { name: 'Copier' }).click())
    expect(region).toHaveTextContent('Lien copié')

    act(() => vi.advanceTimersByTime(4_000))
    expect(region).toBeEmptyDOMElement()
  })
})
