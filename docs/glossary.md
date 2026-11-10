# Glossary

| Term | Meaning |
| --- | --- |
| **Access token** | Short-lived JWT (15 min) sent as `Authorization: Bearer …`; stored in `localStorage` |
| **Card** | One article in the feed, shown full screen (`FeedCard`) |
| **Current card** | The card at least 60 % visible in the feed scroller |
| **Dwell time** (`dwellMs`) | How long a card stayed current while the tab was visible |
| **Event** | A reader interaction sent to `POST /v1/events` (`impression`, `view`, `open`, `read`, `like`…) |
| **Fallback feed** | Articles the API serves when the recommender is unavailable or for a new reader; marked `reason: "fallback"` and `requestId: "fallback"` |
| **Feed** (« Pour vous ») | The home screen: recommended articles, one per screen |
| **Flush** | Sending the queued events now instead of waiting for the timer |
| **Keepalive** | `fetch` option that lets a request finish after the page is closed; used for the last events |
| **Onboarding** | The first topic choice (« Centres d'intérêt »), at least three topics |
| **Position** | Index of a card in its page as sent by the API; copied into events |
| **ProblemDetail** | RFC 9457 error body returned by the API (`status`, `title`, `detail`, `errors`) |
| **Reason** | Why the recommender picked an article: `similar`, `collaborative`, `explore`, `trending`, `onboarding`, or `fallback` |
| **Recommender** (« la reco ») | The separate service that ranks articles for each reader from the events stream |
| **Refresh token** | Long-lived, rotating token in the HttpOnly `swipread_refresh` cookie, used to get new access tokens |
| **Request id** (`requestId`) | Identifier of the batch of recommendations a card came from; lets the recommender measure each batch |
| **Session** | The frontend's `{ accessToken, userId, expiresAt }`; distinct from the tracking session id |
| **Session id** (`sessionId`) | Per-tab identifier (`s_<uuid>`) sent with event batches and to the recommender as `X-Session-Id` |
| **Slug** | Stable technical name of a topic (`jeux-video`), derived from its first label and never changed by renaming |
| **Source** | An RSS or Atom feed the API ingests articles from; managed by admins |
| **Stock** | The reader's queue of up to 50 prepared articles on the API side (Redis); each `GET /v1/feed` consumes 10 |
| **Strong event** | `like`, `save`, `share`, `hide` or a complete `read`: tells the API to refresh the reader's stock |
| **Topic** (« thème ») | A subject readers pick at onboarding; articles are tagged with topics by the ingestion |
| **Tracker** | The app-wide event queue (`src/features/tracking/tracker.ts`) |
