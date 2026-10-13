export type ShareResult = 'native' | 'clipboard' | 'cancelled' | 'failed'

/**
 * Shares through the system share sheet when the browser has one (mobile, some desktops),
 * otherwise copies the link. The result's channel is reported in the `share` event.
 */
export async function shareArticle({ title, url }: { title?: string; url: string }): Promise<ShareResult> {
  const data: ShareData = { title, url }
  if (typeof navigator.share === 'function' && (navigator.canShare?.(data) ?? true)) {
    try {
      await navigator.share(data)
      return 'native'
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return 'cancelled'
      // Share sheet unavailable (e.g. no user activation): fall back to copying.
    }
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'clipboard'
  } catch {
    return 'failed'
  }
}
