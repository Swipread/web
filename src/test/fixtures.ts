import type { Schema } from '../api/types'

export const topics: Schema<'TopicResponse'>[] = [
  { id: 1, slug: 'technologie', label: 'Technologie' },
  { id: 2, slug: 'science', label: 'Science' },
  { id: 3, slug: 'culture', label: 'Culture' },
  { id: 4, slug: 'sport', label: 'Sport' },
  { id: 5, slug: 'environnement', label: 'Environnement' },
]

export const me: Schema<'MeResponse'> = {
  id: 'u_1',
  email: 'lea@exemple.fr',
  displayName: 'Léa',
  locale: 'fr-FR',
  createdAt: '2026-10-01T08:00:00Z',
  topics: topics.slice(0, 3),
}

export const token: Schema<'TokenResponse'> = {
  accessToken: 'jwt-test',
  tokenType: 'Bearer',
  expiresIn: 3600,
  userId: 'u_1',
}

let articleSeq = 0

/** A feed item with a unique article id. */
export function feedItem(overrides: Partial<Schema<'FeedItem'>> = {}): Schema<'FeedItem'> {
  articleSeq += 1
  return {
    articleId: `a_${articleSeq}`,
    title: `Article ${articleSeq}`,
    summary: `Résumé de l'article ${articleSeq}.`,
    url: `https://source.example/articles/${articleSeq}`,
    imageUrl: `https://source.example/images/${articleSeq}.jpg`,
    author: 'Auteur',
    sourceName: 'Le Journal Tech',
    language: 'fr',
    wordCount: 1380,
    publishedAt: new Date(Date.now() - 2 * 3_600_000).toISOString(),
    requestId: 'r_1',
    reason: 'similar',
    position: articleSeq,
    ...overrides,
  }
}

export function feedPage(size = 10): Schema<'FeedResponse'> {
  return { items: Array.from({ length: size }, () => feedItem()) }
}
