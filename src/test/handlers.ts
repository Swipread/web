import { http, HttpResponse, type RequestHandler } from 'msw'
import { adminTopics, feedPage, historyItem, me, savedItem, sources, topics } from './fixtures'
import { apiUrl } from './apiUrl'

/** Default handlers shared by all tests; override per test with `server.use(...)`. */
export const handlers: RequestHandler[] = [
  http.get(apiUrl('/v1/me'), () => HttpResponse.json(me)),
  http.get(apiUrl('/v1/topics'), () => HttpResponse.json(topics)),
  http.get(apiUrl('/v1/feed'), () => HttpResponse.json(feedPage())),
  http.get(apiUrl('/v1/me/saved'), () => HttpResponse.json({ items: [savedItem(), savedItem()] })),
  http.get(apiUrl('/v1/me/history'), () => HttpResponse.json({ items: [historyItem()] })),
  http.get(apiUrl('/v1/admin/sources'), () => HttpResponse.json(sources)),
  http.get(apiUrl('/v1/admin/topics'), () => HttpResponse.json(adminTopics)),
]
