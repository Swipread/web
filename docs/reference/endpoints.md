# Endpoints used

Every API endpoint the frontend calls, and where. Request and response shapes are in the generated `src/api/schema.d.ts` and in the API repository's reference ([`docs/api.md`](https://github.com/Swipread/api/blob/main/docs/api.md)).

| Method | Path | Auth | Called from | Notes |
| --- | --- | --- | --- | --- |
| POST | `/v1/auth/register` | — | `useRegister` | Sets the refresh cookie |
| POST | `/v1/auth/login` | — | `useLogin` | Sets the refresh cookie |
| POST | `/v1/auth/refresh` | cookie | `refreshSession` (`src/api/refresh.ts`) | Plain `fetch` with `credentials: 'include'`, outside the typed client to avoid recursion |
| POST | `/v1/auth/logout` | cookie | `useLogout` | Not awaited |
| GET | `/v1/me` | bearer | `useMe` | Profile, role, topics |
| PATCH | `/v1/me` | bearer | `useUpdateProfile` | `{ displayName }` |
| DELETE | `/v1/me` | bearer | `useDeleteAccount` | 204 |
| GET | `/v1/topics` | bearer | `useTopics` | |
| PUT | `/v1/me/topics` | bearer | `useUpdateTopics` | `{ topicIds }`, at least 3 |
| GET | `/v1/feed` | bearer | `useFeed` | Headers `X-Session-Id`, `X-Device`; up to 10 items per call |
| POST | `/v1/events` | bearer | `tracker` | `{ sessionId, events[≤100] }`, answers 202 with accepted and duplicate counts |
| GET | `/v1/me/saved` | bearer | `useSaved` | `cursor`, `limit=20` |
| GET | `/v1/me/history` | bearer | `useHistory` | `cursor`, `limit=20` |
| GET | `/v1/admin/sources` | admin | `useSources` | |
| POST | `/v1/admin/sources` | admin | `useCreateSource` | The API checks the feed before saving |
| PATCH | `/v1/admin/sources/{id}` | admin | `useSetSourceActive` | `{ active }` |
| DELETE | `/v1/admin/sources/{id}` | admin | `useDeleteSource` | 409 when the source has articles |
| GET | `/v1/admin/topics` | admin | `useAdminTopics` | With `articleCount` and `readerCount` |
| POST | `/v1/admin/topics` | admin | `useCreateTopic` | `{ label }` |
| PATCH | `/v1/admin/topics/{id}` | admin | `useRenameTopic` | `{ label }` |

"bearer" means the `Authorization: Bearer <access token>` header added by the client; "admin" means bearer with the `ADMIN` role; "cookie" means the `swipread_refresh` cookie, sent because the request uses `credentials: 'include'`.

Not used by the frontend: the API's OpenAPI spec (`/v3/api-docs`, read by `npm run gen:api`) and its actuator endpoints.
