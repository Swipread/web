# FAQ and troubleshooting

## Development

**Every request fails with « Impossible de joindre le serveur ».**
The API is not running or `VITE_API_BASE_URL` points to the wrong place. Check `curl http://localhost:8080/actuator/health` and your `.env.local`. Restart `npm run dev` after editing an env file: Vite reads it at startup.

**The browser console shows a CORS error.**
The page is not served from `http://localhost:5173` (another port, or `127.0.0.1` instead of `localhost`), or the API is not running with its `dev` profile, which allows that origin.

**I am logged out after 15 minutes.**
The renewal fails. In the Network tab, `POST /v1/auth/login` must answer with a `Set-Cookie: swipread_refresh=…`, and `POST /v1/auth/refresh` must send it back. Common causes: frontend and API on different sites (`localhost` vs `127.0.0.1` count as different sites), an API older than the refresh-token release, or a browser that blocks the cookie.

**Type errors appeared after pulling.**
The API spec changed: `npm run gen:api`, then fix what the compiler reports.

**The feed shows "fallback" articles only.**
Normal for the first page of a new reader: the API serves its fallback feed while it asks the recommender in the background. Scroll on; the next pages come from the recommender.

**An article I just saved is not in « Sauvegardés ».**
Saves are events, sent in batches. The saved list flushes the queue before loading, so this should not happen in the app; if you call the API yourself, wait for the batch (up to 5 s).

**Images are missing on the cards.**
The source's image failed to load (blocked hotlinking, 404): the card falls back to the source's initial. Images are requested without a referrer.

**Keyboard navigation does nothing in the feed.**
The keys are listened to on the whole page while the feed is shown, but ignored while a text field has the focus and when a modifier key (Shift, Ctrl, Alt, Cmd) is held.

**How do I get an admin account locally?**
The API's dev profile seeds `admin@swipread.dev` / `password123`. For another account, set its role to `ADMIN` in the database; it takes effect at the next token renewal.

## Tests

**A test fails with "unhandled request".**
msw is strict: every request needs a handler. Add one in the test with `server.use(...)`, or in `src/test/handlers.ts` if most tests need it.

**A test passes alone but fails in the full suite.**
Usually an assertion made before a redirect or a debounced update has happened. Wait for the condition with `findBy…` or `waitFor` rather than asserting right after the render.

**How do I test that cookies are sent?**
msw drops the `credentials` option. Spy on `globalThis.fetch` and inspect the request it receives (see `src/api/client.test.ts`).

## Product

**Why can't I remove an article from the history?**
The API has no endpoint for it: the history is built from `open` and `read` events. Hiding an article from the feed (« Pas intéressé ») excludes it from the history.

**Why is there no « mark as unread » or folders for saved articles?**
They are not part of the current user stories.

**Why does the app not show the recommendation reason?**
`reason` (`similar`, `explore`, `trending`…) is sent with each card for tracking, but the wireframes do not display it.
