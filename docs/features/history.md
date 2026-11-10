# Reading history (« Historique »)

Articles the reader opened, most recent first. Code: `src/features/history/`.

## Screen

`/historique` → `HistoryPage`.

- Sections « Aujourd'hui », « Cette semaine » (the six previous days) and « Plus ancien », each with an `h2`; rows use `h3` titles under them.
- Each row: thumbnail, source and reading time, title linking to the source, and when it was read: « Lu à 10 h 12 », « Lu hier », « Lu lundi », then « Lu le 12 oct. ».
- « Relire » reopens the article in a new tab.
- « Charger plus », empty state, error with « Réessayer », as in the saved list.

## Data

`useHistory()`: infinite query `['history']` on `GET /v1/me/history?cursor=&limit=20`. It flushes pending events first, because an article enters the history through its `open` or `read` event.

The API lists an article once, at the date of its latest opening; articles the reader hid are excluded.

## Formatting

`recencyGroup(iso)` and `formatReadAt(iso)` in `src/lib/format.ts` count **calendar days in local time**, not 24-hour spans, so an article read at 23:50 yesterday is « hier » and daylight saving changes do not shift groups.

## Tests

`features/history/history.test.tsx`: grouping by recency, reopening records `open`, loading more, empty state, retry, link in the navigation. `lib/format.test.ts` covers the date helpers.
