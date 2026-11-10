# Saved articles (« Sauvegardés »)

Articles the reader kept for later. Code: `src/features/saved/`.

## Screen

`/sauvegardes` → `SavedPage`.

- Header « Sauvegardés » with a subtitle: the count (« 4 articles à lire plus tard ») once every page is loaded, « Vos articles à lire plus tard » while more pages remain.
- One `ArticleRow` per article, most recently saved first: thumbnail, source and reading time, title linking to the source (new tab), « Sauvegardé il y a 2 h ».
- Row actions: share (icon button labelled « Partager « <title> » ») and « Retirer ».
- « Charger plus » when the API returns a `nextCursor`.
- States: loading, error with « Réessayer », empty state with a link back to the feed. An error while loading more is shown under the list.

## Data

| Hook | Does |
| --- | --- |
| `useSaved()` | Infinite query `['saved']`: `GET /v1/me/saved?cursor=&limit=20`. Flushes pending events first, so an article saved a second ago from the feed is listed |
| `useUnsave()` | Records an `unsave` event, removes the article from the cached pages and sets `saved: false` on the cached feed card |

There is no endpoint to delete a saved article: the event log is the source of truth on the server, and the recommendation service receives the signal.

## Behaviour

- Opening an article (its title) records `open`; sharing records `share` with its channel. These events carry no `requestId`: the article was not served by the feed at that moment.
- « Retirer » shows the toast « Article retiré des sauvegardés » and moves focus to the row that took its place (or the previous one at the end), so keyboard users keep their place. When the last article goes, the empty state appears.

## Tests

`features/saved/saved.test.tsx`: order and dates, loading more with the cursor, flushing events first, open and share events, removal with `unsave` and focus, empty state after the last removal, the cached feed card unmarked, retry on error.
