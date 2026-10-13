import { useCallback } from 'react'
import { useToast } from '../../ui/toastContext'
import { shareArticle, type ShareResult } from './shareArticle'

/** Shares an article and confirms a copied link with a toast. */
export function useShare() {
  const toast = useToast()
  return useCallback(
    async (article: { title?: string; url?: string }): Promise<ShareResult> => {
      if (!article.url) return 'failed'
      const result = await shareArticle({ title: article.title, url: article.url })
      if (result === 'clipboard') toast.show('Lien copié')
      if (result === 'failed') toast.show('Impossible de partager ce lien.')
      return result
    },
    [toast],
  )
}
