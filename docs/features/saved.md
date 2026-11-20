# Saved articles (« Sauvegardés »)

Articles the reader kept for later. Code: `src/features/saved/`.

## Screen

`/sauvegardes` → `SavedPage`.

- Header « Sauvegardés » with a subtitle: the count (« 4 articles à lire plus tard ») once every page is loaded, « Vos articles à lire plus tard » while more pages remain.
- One `ArticleRow` per article, most recently saved first: 16:9 thumbnail (the topic's gradient when there is no image), source · topic, the title, « Sauvegardé il y a 2 h · 4 min » (no reading time when `wordCountFromSummary`). The whole row opens the article at its source (new tab). The list keeps a reading measure (48rem).
- Row actions, round 40px icon buttons: a filled bookmark labelled « Retirer « <title> » des sauvegardés » (the same icon as the feed's save toggle), then « Partager « <title> » ».
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
- Removing shows the toast « Article retiré des sauvegardés » and moves focus to the row that took its place (or the previous one at the end), so keyboard users keep their place. When the last article goes, the empty state appears.

## Tests

`features/saved/saved.test.tsx`: order and dates, loading more with the cursor, flushing events first, open and share events, removal with `unsave` and focus, empty state after the last removal, the cached feed card unmarked, retry on error.
