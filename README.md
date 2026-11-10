# Swipread web

Swipread is a reading app that works like a short-video feed, but for articles: recommended articles are shown one card per screen, and the reader scrolls to the next one. Every interaction (time spent on a card, opening, reading, liking, saving, sharing, hiding) is sent to the backend, which feeds a recommendation service so the feed adapts to the reader.

This repository is the **web frontend**: desktop first, responsive down to mobile, with light and dark themes. The UI is in French. It talks to the Swipread API (Spring Boot, separate repository) over REST.

![The "Pour vous" feed](docs/images/feed.png)

| Dark theme | Mobile | Saved articles |
| --- | --- | --- |
| ![Feed in dark mode](docs/images/feed-dark.png) | ![Feed on mobile](docs/images/feed-mobile.png) | ![Saved articles](docs/images/saved.png) |

## Features

- **Account**: sign up, log in, short-lived access token renewed in the background from an HttpOnly refresh cookie, log out, edit the display name, delete the account.
- **Onboarding**: pick at least three topics before the first feed.
- **Feed**: full-screen cards with scroll snapping, ↑/↓ keyboard navigation, prefetching of the next page, position restored when coming back.
- **Reactions**: like, save, share (Web Share API with clipboard fallback), "not interested".
- **Saved** and **history** pages; the history is grouped by recency (today, this week, older).
- **Event tracking**: impressions, dwell time, opens and reading time, sent in batches and flushed with `keepalive` when the tab closes.
- **Administration** (admin role): manage article sources (the feed URL is checked by the API) and topics.
- **Accessibility**: keyboard navigation, visible focus, ARIA labels on icon buttons, `prefers-reduced-motion` and `prefers-color-scheme` support.

## Tech stack

| Area | Choice |
| --- | --- |
| UI | React 19, TypeScript, CSS Modules with design tokens |
| Build | Vite |
| Routing | React Router (data mode) |
| Server state | TanStack Query |
| API client | `openapi-fetch` with types generated from the API's OpenAPI spec (`openapi-typescript`) |
| Forms | React Hook Form + Zod |
| Tests | Vitest, Testing Library, Mock Service Worker (msw) |

## Quick start

Requirements: Node.js 20.19+ or 22.12+, and the Swipread API running locally (by default on `http://localhost:8080`, see its README).

```bash
npm install
cp .env.example .env.local   # VITE_API_BASE_URL=http://localhost:8080
npm run dev                  # http://localhost:5173
```

The API only accepts browser calls from `http://localhost:5173` in development, so keep that port. In the API's dev profile you can log in with `admin@swipread.dev` / `password123`, or create an account.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server on port 5173 |
| `npm test` | Run the test suite once (`npm run test:watch` to watch) |
| `npm run lint` | Lint with ESLint |
| `npm run build` | Type-check and build for production into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run gen:api` | Regenerate `src/api/schema.d.ts` from the API's OpenAPI spec (`OPENAPI_URL` to change the URL) |

## Project layout

```
src/
  api/        API client, generated types, error mapping, token refresh
  app/        routes, guards, layout, sidebar
  features/   one folder per feature: auth, onboarding, feed, tracking, share, saved, history, profile, admin
  lib/        small helpers (session storage, ids, formatting, media queries)
  ui/         shared components and design tokens
  test/       msw server, handlers, fixtures, render helpers
```

## Documentation

- [Getting started](docs/getting-started.md): setup, environment, running against the API, troubleshooting
- [Architecture](docs/architecture.md): code organisation, routing, data fetching, the feed, the design system
- [Backend integration](docs/backend-integration.md): generated types, API client, errors, authentication and token refresh, event tracking
- [Testing](docs/testing.md): tools, conventions and helpers
- [Contributing](docs/contributing.md): conventions, commits, accessibility checklist

## License

All rights reserved. The source is published for reference only; no license is granted to use, copy, modify or distribute it without the author's written permission.
