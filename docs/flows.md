# Flows

Step-by-step sequences for the paths that cross several modules. Participants: the React screens (UI), the typed client (`api`), the event queue (`tracker`) and the API.

## First visit: sign-up → onboarding → feed

```mermaid
sequenceDiagram
    actor R as Reader
    participant UI
    participant A as API

    R->>UI: /inscription, fills the form
    UI->>A: POST /v1/auth/register (credentials: include)
    A-->>UI: 201 accessToken + Set-Cookie swipread_refresh
    Note over UI: session.save → RedirectIfAuthenticated → "/"
    UI->>A: GET /v1/me (RequireOnboarding)
    A-->>UI: topics: []
    Note over UI: redirect to /centres-interet
    UI->>A: GET /v1/topics
    R->>UI: picks ≥ 3 topics, « Continuer vers mon fil »
    UI->>A: PUT /v1/me/topics
    A-->>UI: chosen topics
    Note over UI: ['me'] updated, ['feed'] removed, navigate("/")
    UI->>A: GET /v1/feed (X-Session-Id, X-Device)
    A-->>UI: 10 items from the fallback feed (reason "fallback")
    Note over A: fills the reader's stock from the recommender in the background
```

## Feed paging

```mermaid
sequenceDiagram
    actor R as Reader
    participant F as FeedPage
    participant Q as Query cache
    participant A as API

    F->>A: GET /v1/feed
    A-->>F: page 1 (10 cards)
    R->>F: scrolls / presses ↓
    Note over F: useActiveIndex reports card 6 (≤ 3 cards left below)
    F->>A: GET /v1/feed (fetchNextPage)
    A-->>F: page 2, from the recommender's stock
    Q->>Q: pages appended, cards deduplicated
    R->>F: reaches the last card
    alt API returns an empty page
        F-->>R: end slide « Vous êtes à jour »
    else request fails
        F-->>R: end slide error with « Réessayer »
    end
```

Each call consumes articles on the server, which is why the feed is never refetched and why changing topics drops it from the cache.

## Life of an event

```mermaid
sequenceDiagram
    participant F as Feed card
    participant T as tracker
    participant A as API
    participant S as Recommender

    F->>T: track({ type: 'view', articleId, requestId, position, payload: { dwellMs } })
    Note over T: adds eventId (e_…) and occurredAt, starts the 5 s timer
    alt 20 events queued, 5 s elapsed, tab hidden or logout
        T->>A: POST /v1/events { sessionId, events }
    end
    A-->>T: 202 { accepted, duplicates }
    Note over A: stores the events, updates per-article state, writes the stream message in an outbox
    A->>S: events stream (within ~200 ms)
    opt strong signal (like, save, share, hide, complete read)
        Note over A: trims the reader's stock and asks for new recommendations
    end
```

On a network error, 429 or 5xx the batch goes back to the head of the queue and is sent again later; the API ignores duplicates by `eventId`. On `pagehide` the queue closes the current `view` and sends everything with `keepalive`.

## Open and read an article

```mermaid
sequenceDiagram
    actor R as Reader
    participant F as Feed
    participant T as tracker

    R->>F: « Lire l'article »
    F->>T: open
    Note over F: the source's page opens in a new tab; the app tab becomes hidden
    Note over F: dwell of the current card paused
    R->>F: comes back to the app tab
    F->>T: read { readMs: time away }
    Note over F: dwell resumes for the current card
```

## Token renewal across tabs

```mermaid
sequenceDiagram
    participant TA as Tab A
    participant TB as Tab B
    participant L as Web Lock "swipread.refresh"
    participant A as API

    TA->>A: GET /v1/me/history (expired token)
    A-->>TA: 401
    TB->>A: GET /v1/me/saved (expired token)
    A-->>TB: 401
    TA->>L: request lock
    TB->>L: request lock (waits)
    TA->>A: POST /v1/auth/refresh (cookie v1)
    A-->>TA: new access token + cookie v2
    Note over TA: session.save → localStorage → storage event in tab B
    TA->>L: release
    TB->>L: lock acquired
    Note over TB: the token changed while waiting and is fresh: reuse it, no call
    TA->>A: request replayed with the new token
    TB->>A: request replayed with the new token
```

If two renewals still reach the API with the same cookie (no Web Locks support, separate browser windows racing), the second one arrives within the API's 10-second grace period and gets an access token without rotation. A refresh token reused after that period is treated as stolen: the API revokes the whole session and both tabs end up on the login page.

## Add a source (admin)

```mermaid
sequenceDiagram
    actor Ad as Admin
    participant UI as SourcesPage
    participant A as API
    participant Feed as Remote feed

    Ad->>UI: fills the form, « Vérifier et ajouter »
    Note over UI: Zod validation (http(s) URLs, 2-letter language)
    UI->>A: POST /v1/admin/sources
    A->>Feed: GET feedUrl (public address, ports 80/443, ≤ 5 redirects, ≤ 5 MB)
    alt valid RSS/Atom with articles
        A-->>UI: 201 source
        Note over UI: inserted in the table, form reset, toast
    else unreachable, HTTP error, not a feed, empty, forbidden address
        A-->>UI: 422 detail
        Note over UI: translated message under « URL du flux »
    else feed URL already used
        A-->>UI: 409
    end
```

## Remove a saved article

```mermaid
sequenceDiagram
    actor R as Reader
    participant S as SavedPage
    participant Q as Query cache
    participant T as tracker
    participant A as API

    R->>S: « Retirer »
    S->>T: unsave { articleId }
    S->>Q: remove from ['saved'], saved=false in ['feed']
    S-->>R: toast, focus on the next row
    T->>A: POST /v1/events (within 5 s)
    Note over A: saved_at cleared; the next GET /v1/me/saved no longer lists it
```
