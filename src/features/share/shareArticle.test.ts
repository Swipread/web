import { afterEach, describe, expect, it, vi } from 'vitest'
import { shareArticle } from './shareArticle'

const article = { title: 'Les batteries solides', url: 'https://source.example/a' }

function stubNavigator(overrides: Partial<Navigator>) {
  for (const [key, value] of Object.entries(overrides)) {
    Object.defineProperty(navigator, key, { value, configurable: true })
  }
}

describe('shareArticle', () => {
  afterEach(() => {
    for (const key of ['share', 'canShare', 'clipboard']) {
      delete (navigator as unknown as Record<string, unknown>)[key]
    }
  })

  it('uses the native share sheet when available', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ share, canShare: () => true })

    await expect(shareArticle(article)).resolves.toBe('native')
    expect(share).toHaveBeenCalledWith(article)
  })

  it('reports a cancelled share sheet without copying', async () => {
    const writeText = vi.fn()
    stubNavigator({
      share: vi.fn().mockRejectedValue(new DOMException('cancelled', 'AbortError')),
      clipboard: { writeText } as unknown as Clipboard,
    })

    await expect(shareArticle(article)).resolves.toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })

  it('copies the link when there is no share sheet', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({ clipboard: { writeText } as unknown as Clipboard })

    await expect(shareArticle(article)).resolves.toBe('clipboard')
    expect(writeText).toHaveBeenCalledWith(article.url)
  })

  it('falls back to copying when the share sheet fails', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    stubNavigator({
      share: vi.fn().mockRejectedValue(new DOMException('no activation', 'NotAllowedError')),
      clipboard: { writeText } as unknown as Clipboard,
    })

    await expect(shareArticle(article)).resolves.toBe('clipboard')
  })

  it('reports a failure when the link cannot be copied', async () => {
    stubNavigator({ clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } as unknown as Clipboard })
    await expect(shareArticle(article)).resolves.toBe('failed')
  })
})
