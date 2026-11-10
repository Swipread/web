# Hooks and cache

All server state lives in one TanStack Query client (`src/api/queryClient.ts`: queries retry once, no refetch on window focus; mutations never retry). This page maps every query key to the hooks that read and change it.

## Query keys

| Key | Hook | Endpoint | Kind | Notes |
| --- | --- | --- | --- | --- |
| `['me']` | `useMe` | `GET /v1/me` | query | `staleTime` 5 min. Read by the guards, the sidebar (admin links) and the profile |
| `['topics']` | `useTopics` | `GET /v1/topics` | query | Topics offered to readers |
| `['feed']` | `useFeed` | `GET /v1/feed` | infinite | `staleTime: Infinity`, `gcTime` 30 min, page param is a counter |
| `['saved']` | `useSaved` | `GET /v1/me/saved` | infinite | Cursor pagination, 20 per page, flushes events first |
| `['history']` | `useHistory` | `GET /v1/me/history` | infinite | Cursor pagination, 20 per page, flushes events first |
| `['admin', 'sources']` | `useSources` | `GET /v1/admin/sources` | query | Sorted by name |
| `['admin', 'topics']` | `useAdminTopics` | `GET /v1/admin/topics` | query | Sorted by label, with counts |

## Who changes what

| Action | Hook | Cache effect |
| --- | --- | --- |
| Log in, sign up | `useLogin`, `useRegister` | Saves the session; queries load on the next screen |
| Log out | `useLogout` | `queryClient.clear()` |
| Edit display name | `useUpdateProfile` | `setQueryData(['me'], response)` |
| Save topics | `useUpdateTopics` | Writes `topics` into `['me']`, **removes** `['feed']`, clears the feed position |
| Delete account | `useDeleteAccount` | `queryClient.clear()` |
| Like / save / hide in the feed | `useFeed().updateCard` / `removeCard` | Patches the cached feed pages (events are sent by `tracker`) |
| Remove from saved | `useUnsave` | Removes the item from `['saved']` and patches `saved: false` in `['feed']` |
| Add a source | `useCreateSource` | Inserts into `['admin', 'sources']`, sorted |
| Activate / deactivate a source | `useSetSourceActive` | Replaces the source in `['admin', 'sources']` |
| Delete a source | `useDeleteSource` | Removes it from `['admin', 'sources']` |
| Create a topic | `useCreateTopic` | Inserts into `['admin', 'topics']`, **invalidates** `['topics']` and `['me']` |
| Rename a topic | `useRenameTopic` | Replaces and re-sorts in `['admin', 'topics']`, invalidates `['topics']` and `['me']` |
| Session ends (401) | unauthorized handler | `queryClient.clear()` |

Prefer writing the response into the cache when the API returns the new state; invalidate only data that other screens derive from it.

## Non-query hooks

| Hook | Where | Purpose |
| --- | --- | --- |
| `useSession` | auth | Current session from `src/lib/session.ts` |
| `useTopicSelection` | onboarding | Local topic selection seeded from the profile |
| `useActiveIndex` | feed | Index of the card on screen (IntersectionObserver, 60 %) |
| `useFeedKeyboard` | feed | Arrow and Page keys |
| `useFeedTracking` | tracking | Impression, view, open/read events of the feed |
| `useShare` | share | Share sheet or clipboard, with toasts |
| `useToast` | ui | `show(message)` |

## Other client-side state

| Storage | Key | Content |
| --- | --- | --- |
| `localStorage` | `swipread.session` | Access token, user id, expiry |
| `sessionStorage` | `swipread.sessionId` | Tracking session id (`s_<uuid>`), one per tab |
| `sessionStorage` | `swipread.feed.articleId` | Card to reopen the feed on |
| Cookie (HttpOnly) | `swipread_refresh` | Refresh token, set and read by the API only |
| Memory | `tracker` queue | Pending events (lost if the tab crashes before a flush) |
