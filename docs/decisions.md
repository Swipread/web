# Decision records

Short architecture decision records (ADR): what was decided, why, and what it costs. Add a new record rather than rewriting an old one when a decision changes.

## ADR-1 · Types generated from the OpenAPI spec, typed client with `openapi-fetch`

**Context.** The API is developed by another team and its contract evolves. Hand-written DTOs drift silently.

**Decision.** `openapi-typescript` generates `src/api/schema.d.ts` from the API's spec; calls go through `openapi-fetch`, which types paths, parameters, bodies and responses from it. The file is never edited by hand.

**Consequences.** An API change shows up as a type error after `npm run gen:api`. The client is a thin wrapper over `fetch`: no generated functions, only types. Generated fields are all optional (the spec does not mark them required), so code checks for `undefined` where it matters.

## ADR-2 · TanStack Query for server state, no global store

**Decision.** Every API read is a query, every write a mutation; components never call `fetch`. There is no Redux-like store: the only client-side state is the session, the event queue and a few `sessionStorage` keys.

**Consequences.** Loading, error and retry states come for free and are handled the same way on every screen. Cache keys must be kept consistent (see [Hooks and cache](reference/hooks-and-cache.md)).

## ADR-3 · The feed is a non-refetching infinite query

**Context.** `GET /v1/feed` has no cursor: each call consumes the next articles of the reader's stock on the server.

**Decision.** `staleTime: Infinity`, no refetch on focus, deduplication by `articleId`, and the cache is dropped (not refetched) when topics change.

**Consequences.** Going back to the feed shows the same cards, and the position is restored from `sessionStorage`. A reload of the browser starts a fresh feed, which is expected.

## ADR-4 · Events batched client-side, final flush with `fetch` keepalive

**Context.** The recommender needs fine-grained signals (dwell time, reading time). Sending one request per event would be wasteful, and events must survive the tab closing.

**Decision.** A queue batches events (5 s, 20 events, 100 per request) and flushes with `fetch(…, { keepalive: true })` on `visibilitychange` and `pagehide`. `navigator.sendBeacon` is not used because it cannot send the `Authorization` header, and the API identifies the reader from the JWT only.

**Consequences.** Pending events can be lost if the browser crashes. Lists that depend on events (saved, history) flush the queue before fetching.

## ADR-5 · Refresh token in an HttpOnly cookie, short-lived access token

**Context.** A 24-hour token in `localStorage` forced a daily login and stayed usable for a day if stolen.

**Decision.** The access token lasts 15 minutes and stays in `localStorage` (it must be read to set the `Authorization` header). The refresh token is an HttpOnly, `SameSite=Strict` cookie scoped to `/v1/auth`, rotated at every use. The client renews on 401 and shortly before expiry; one renewal at a time thanks to a shared promise and a Web Lock across tabs.

**Consequences.** An XSS cannot read the refresh token, and a stolen access token expires quickly. The frontend and the API must be on the same site (the cookie is not sent across sites). Cookies are only sent to `/v1/auth`, so other endpoints are not exposed to CSRF.

## ADR-6 · No fake endpoints, no JWT decoding

**Decision.** When the API lacks something, the frontend asks for it instead of simulating it. The JWT is opaque to the frontend: the role and the profile come from `GET /v1/me`.

**Consequences.** Some features waited for the API (history, account deletion, admin). There is a single source of truth for permissions: the API.

## ADR-7 · CSS Modules with design tokens, no UI library

**Decision.** One CSS Module per component, all values from `src/ui/tokens.css`, a dozen in-house components, inline SVG icons.

**Consequences.** Small bundle, full control over accessibility and the sober look of the wireframes, automatic dark mode through `prefers-color-scheme`. Each new component must handle focus, states and both themes itself.

## ADR-8 · French UI, English code

**Decision.** User-facing strings are written directly in French in the components; code, tests and docs are in English. There is no i18n framework.

**Consequences.** Simple and readable while the product is French-only. Adding a second language would mean extracting strings into catalogues.

## ADR-9 · Server error messages are never shown as is

**Decision.** `ApiError` messages are chosen from the HTTP status, field errors from the constraint code, and known `detail` values are translated per screen.

**Consequences.** The UI stays in French whatever the server's language. New error cases need a translation (see [Messages](reference/messages.md)).

## ADR-10 · Accessibility as a requirement, tested through roles

**Decision.** Keyboard navigation (including the feed), visible focus, ARIA labels on icon buttons, `aria-pressed` toggles, live regions for counters and toasts, reduced motion. Tests query elements by role and accessible name.

**Consequences.** A missing label usually breaks a test. Components in `src/ui/` enforce labels through required props.
