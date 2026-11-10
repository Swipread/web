# Testing

```bash
npm test              # run once (CI)
npm run test:watch    # watch mode
npx vitest run src/features/feed   # one folder
```

The suite runs in jsdom and never calls a real server: the API is mocked with [Mock Service Worker](https://mswjs.io/). It runs in a few seconds.

## Tools

| Tool | Role |
| --- | --- |
| Vitest | Test runner, configured in `vite.config.ts` (`environment: 'jsdom'`, `restoreMocks: true`) |
| Testing Library | Render components and query them like a user would (roles, labels, text) |
| `@testing-library/user-event` | Realistic clicks and typing |
| msw | Intercepts `fetch` and answers from handlers typed against the generated schema |

## Conventions

- A test file sits next to what it tests: `feed.test.tsx` in `src/features/feed/`, `format.test.ts` next to `format.ts`.
- Test behaviour through the UI: find elements by role and accessible name (`getByRole('button', { name: 'Sauvegarder' })`), not by class or test id. This also checks the accessibility labels.
- Page-level tests render the real route table (`renderRoutes(routes, { path: '/profil' })`), so guards, layout and redirects are covered too.
- Test names are in English; the UI strings they look for are in French.
- Every screen gets at least: the nominal content, the empty state, and the error state with « Réessayer ».

## Helpers (`src/test/`)

| File | Content |
| --- | --- |
| `setup.ts` | Starts msw, and after each test resets handlers, the event queue, the session and web storage. Stubs the browser APIs jsdom lacks (`IntersectionObserver`, `scrollIntoView`, `<dialog>`) |
| `server.ts`, `apiUrl.ts` | The msw server and `apiUrl(path)`, which prefixes the test API base URL (`http://api.test`) |
| `handlers.ts` | Default handlers: a regular reader's profile, topics, a feed page, saved and history items, admin lists. `POST /v1/auth/refresh` answers 401 by default (no refresh cookie) |
| `fixtures.ts` | Typed sample data: `me`, `admin`, `topics`, `token`, `feedItem()`, `feedPage()`, `savedItem()`, `historyItem()`… |
| `render.tsx` | `renderWithProviders(ui)` and `renderRoutes(routes)`: QueryClient (no retries), memory router, toasts, and a `user-event` instance |
| `intersectionObserver.ts` | `setVisible(element)` makes a feed card the current one |

## Recipes

Override a handler for one test:

```ts
server.use(http.get(apiUrl('/v1/me/saved'), () => HttpResponse.json({ items: [] })))
```

Simulate a ProblemDetail error:

```ts
server.use(
  http.post(apiUrl('/v1/admin/sources'), () =>
    HttpResponse.json(
      { status: 422, title: 'Unprocessable', detail: 'Feed has no articles' },
      { status: 422, headers: { 'Content-Type': 'application/problem+json' } },
    ),
  ),
)
```

Start logged in:

```ts
session.save(token)
```

Check the events a test produced: tracking tests intercept `POST /v1/events` with a handler that records the bodies, then call `tracker.flush()`.

## Pitfalls

- **`credentials` is dropped by msw.** To check that a request sends cookies, spy on `fetch` (`vi.spyOn(globalThis, 'fetch')`) and inspect the request it receives.
- **Redirects happen in an effect.** After rendering a guarded route, wait for `router.state.location.pathname` with `waitFor` before asserting what is on screen.
- **Timers.** Tests that rely on the 5-second flush or on token expiry use `vi.useFakeTimers()`; restore real timers afterwards.
