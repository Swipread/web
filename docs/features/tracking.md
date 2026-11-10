# Tracking

Every reader interaction is reported to the API, which stores it and forwards it to the recommendation service. Code: `src/features/tracking/`.

## Rules

- Always go through `tracker`; never call `POST /v1/events` directly.
- The client generates `eventId` (`e_<uuid>`) and `occurredAt`; the API deduplicates on `eventId`, so resending is safe.
- `requestId` and `position` come from the feed card and must be copied as received: they let the recommendation service measure each batch of recommendations. Fallback articles carry `requestId: "fallback"`.

## Event catalogue

| Type | Emitted by | When | Payload |
| --- | --- | --- | --- |
| `impression` | `useFeedTracking` | A card becomes the current one, once per card per page load | — |
| `view` | `useFeedTracking` | The card stops being current, the feed unmounts, or the tab closes | `dwellMs`: visible time only (paused while the tab is hidden) |
| `open` | feed card, saved list, history | « Lire l'article », a list title or « Relire » | — |
| `read` | `useFeedTracking` | The reader comes back to the tab after an `open` from the feed | `readMs`: time spent away |
| `like`, `unlike` | feed | Heart toggled | — |
| `save`, `unsave` | feed, saved list | Bookmark toggled, « Retirer » | — |
| `share` | feed, saved list | Shared through the share sheet or copied | `channel`: `native` or `clipboard` |
| `hide` | feed | « Pas intéressé » | — |

`scrollDepth` is part of the contract but cannot be measured on a third-party site, so `read` never sends it; the API judges a complete read from `readMs` and the article's length.

Events emitted outside the feed (saved list, history) have no `requestId` or `position`: the article was not served by a recommendation batch at that moment.

## Queue

`createEventQueue(send)` in `eventQueue.ts`, instantiated once as `tracker` in `tracker.ts`.

| Setting | Value |
| --- | --- |
| Flush interval | 5 s after the first queued event |
| Flush threshold | 20 events |
| Batch size | ≤ 100 events per request (API limit) |
| Queue cap | 500 events; the oldest are dropped beyond that |
| Retry | Network errors, 429 and 5xx put the batch back at the head of the queue; other errors (400) drop it |

API:

| Method | Use |
| --- | --- |
| `track(input)` | Adds an event (without `eventId` and `occurredAt`) |
| `flush({ keepalive })` | Sends everything now |
| `flushOnExit()` | Runs the exit finalizers (e.g. closes the current `view`) then flushes with `keepalive` |
| `onExit(fn)` | Registers a finalizer, returns an unregister function |
| `clear()` | Drops pending events and finalizers (logout, account deletion, tests) |

`startTracking()` (called in `main.tsx`) flushes with `keepalive` when the tab becomes hidden and runs `flushOnExit()` on `pagehide`. Hiding does not run the finalizers: opening an article hides the tab, and the current card's `view` must keep running.

`sendBatch` reads the session when the batch leaves and sends it with `Authorization`; if there is no session the batch is dropped.

## Reading time

`useFeedTracking` measures two durations with `performance.now()`:

- **dwell**: time the current card is on screen while the tab is visible;
- **read**: from the moment the tab is hidden after an `open` until it becomes visible again.

## Interplay with lists

Saves, unsaves and opens travel as events, so the saved list and the history call `tracker.flush()` before fetching: an article saved a second ago is listed. There is no `DELETE /v1/me/saved/{id}`: removing from the saved list is an `unsave` event plus a local cache update.

## Tests

`features/tracking/eventQueue.test.ts` (interval, threshold, batching, retry policy, keepalive and finalizers) and `features/tracking/feedTracking.test.tsx` (impressions, dwell time with hidden tabs, open → read, reactions, flush with the token on logout).
