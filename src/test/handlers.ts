import { http, HttpResponse, type RequestHandler } from 'msw'
import { feedPage, me, topics } from './fixtures'
import { apiUrl } from './apiUrl'

/** Default handlers shared by all tests; override per test with `server.use(...)`. */
export const handlers: RequestHandler[] = [
  http.get(apiUrl('/v1/me'), () => HttpResponse.json(me)),
  http.get(apiUrl('/v1/topics'), () => HttpResponse.json(topics)),
  http.get(apiUrl('/v1/feed'), () => HttpResponse.json(feedPage())),
]
