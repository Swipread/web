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
  role: 'READER',
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
    topics: [topics[0]],
    liked: false,
    saved: false,
    requestId: 'r_1',
    reason: 'similar',
    position: articleSeq,
    ...overrides,
  }
}

export function feedPage(size = 10): Schema<'FeedResponse'> {
  return { items: Array.from({ length: size }, () => feedItem()) }
}

/** An article as listed in Sauvegardés and Historique. */
export function article(overrides: Partial<Schema<'ArticleResponse'>> = {}): Schema<'ArticleResponse'> {
  const { articleId, title, summary, url, imageUrl, author, sourceName, language, wordCount, publishedAt, topics } =
    feedItem()
  return { id: articleId, title, summary, url, imageUrl, author, sourceName, language, wordCount, publishedAt, topics, ...overrides }
}

export function savedItem(overrides: Partial<Schema<'ArticleResponse'>> = {}, savedAt?: string) {
  return {
    article: article(overrides),
    savedAt: savedAt ?? new Date(Date.now() - 26 * 3_600_000).toISOString(),
    liked: false,
  } satisfies Schema<'SavedArticleResponse'>
}

export function historyItem(overrides: Partial<Schema<'ArticleResponse'>> = {}, readAt?: string) {
  return {
    article: article(overrides),
    readAt: readAt ?? new Date(Date.now() - 3_600_000).toISOString(),
    liked: false,
    saved: false,
  } satisfies Schema<'HistoryItemResponse'>
}

export const admin: Schema<'MeResponse'> = { ...me, id: 'u_admin', displayName: 'Admin', role: 'ADMIN' }

export const sources: Schema<'SourceResponse'>[] = [
  {
    id: 1,
    name: 'Le Journal Tech',
    siteUrl: 'https://journaltech.fr',
    feedUrl: 'https://journaltech.fr/rss',
    language: 'fr',
    license: 'Résumé + lien',
    active: true,
  },
  {
    id: 2,
    name: 'Sport Hebdo',
    siteUrl: 'https://sporthebdo.fr',
    feedUrl: 'https://sporthebdo.fr/rss',
    language: 'fr',
    active: false,
  },
]

export const adminTopics: Schema<'AdminTopicResponse'>[] = [
  { id: 3, slug: 'culture', label: 'Culture', articleCount: 702, readerCount: 190 },
  { id: 2, slug: 'science', label: 'Science', articleCount: 956, readerCount: 248 },
  { id: 1, slug: 'technologie', label: 'Technologie', articleCount: 1284, readerCount: 312 },
]
