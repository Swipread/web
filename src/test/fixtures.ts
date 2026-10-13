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
