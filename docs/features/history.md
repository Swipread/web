# Reading history (« Historique »)

Articles the reader opened, most recent first. Code: `src/features/history/`.

## Screen

`/historique` → `HistoryPage`.

- Sections « Aujourd'hui », « Cette semaine » (the six previous days) and « Plus ancien », each with an `h2` heading; rows use `h3` titles under them.
- Each row (`ArticleRow`): 16:9 thumbnail (the topic's gradient when there is no image), source · topic, the title, then when it was read and the reading time: « Lu à 10 h 12 · 4 min », « Lu hier », « Lu lundi », then « Lu le 12 oct. ». The whole row reopens the article at its source (new tab).
- Row actions: « Sauvegarder « <title> » », a toggle (`aria-pressed`, filled bookmark when saved) starting from the `saved` flag the API returns, and « Partager « <title> » ».
- « Charger plus », empty state, error with « Réessayer », as in the saved list.

## Data

`useHistory()`: infinite query `['history']` on `GET /v1/me/history?cursor=&limit=20`. It flushes pending events first, because an article enters the history through its `open` or `read` event.

`useHistorySave()` saves or unsaves from a row: it records a `save` / `unsave` event (no `requestId`, as from the saved list), updates the row's `saved` flag in the cache (`patchHistorySaved`), sets the cached feed card, and invalidates `['saved']` so the list is fetched again on its next visit. Unsaving from Sauvegardés also clears the flag in the cached history.

The API lists an article once, at the date of its latest opening; articles the reader hid are excluded.

## Formatting

`recencyGroup(iso)` and `formatReadAt(iso)` in `src/lib/format.ts` count **calendar days in local time**, not 24-hour spans, so an article read at 23:50 yesterday is « hier » and daylight saving changes do not shift groups.

## Tests

`features/history/history.test.tsx`: grouping by recency, reopening from the row records `open`, saving, unsaving and sharing from a row, loading more, empty state, retry, link in the navigation. `lib/format.test.ts` covers the date helpers.
