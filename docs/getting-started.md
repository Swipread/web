# Getting started

## Requirements

- **Node.js** 20.19+ or 22.12+ (required by Vite) and npm.
- **The Swipread API** running locally. It needs Java 25 and Docker (PostgreSQL with pgvector and Redis are started through Docker Compose). See the [API repository](https://github.com/Swipread/api).
- A recent Chromium, Firefox or Safari. The app relies on `scroll-snap`, the native `<dialog>` element and, when available, the Web Locks API.

## Install

```bash
npm install
cp .env.example .env.local
```

## Environment variables

| Variable | Default (`.env.example`) | Purpose |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `http://localhost:8080` | Base URL of the Swipread API, without trailing slash |

Vite only exposes variables prefixed with `VITE_`. `.env.local` is ignored by git. Tests do not read it: they use `http://api.test`, set in `vite.config.ts`.

## Run against the API

1. Start the API in its `dev` profile (port 8080). It creates the schema, seeds topics, sample articles and an admin account, and allows CORS from `http://localhost:5173` with credentials.
2. Start the frontend:

   ```bash
   npm run dev
   ```

3. Open <http://localhost:5173> and log in with `admin@swipread.dev` / `password123`, or create an account. A new reader is sent to the topic picker first.

Keep port 5173: it is the only origin the API accepts in development, and the refresh token cookie is only sent between `localhost:5173` and `localhost:8080` because they are the same site.

To point the app at another API instance without editing `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8089 npm run dev
```

## Regenerate the API types

The types in `src/api/schema.d.ts` are generated from the API's OpenAPI spec and must never be edited by hand. After an API change:

```bash
npm run gen:api                                              # reads http://localhost:8080/v3/api-docs
OPENAPI_URL=http://localhost:8089/v3/api-docs npm run gen:api   # another instance
```

Then run `npm run build` (it type-checks) and `npm test` to find what the change broke.

## Production build

```bash
npm run build     # type-check, then build into dist/
npm run preview   # serve dist/ locally
```

`dist/` is a static site. Serve it behind any static host with a fallback to `index.html` for client-side routes (`/connexion`, `/sauvegardes`, `/admin/sources`…). Build with the production `VITE_API_BASE_URL`. The frontend and the API must be on the same site (for example `app.example.com` and `api.example.com`): the refresh token cookie is `SameSite=Strict`.

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Every request fails with « Impossible de joindre le serveur » | The API is not running, or `VITE_API_BASE_URL` points to the wrong port |
| CORS error in the browser console | The dev server is not on port 5173, or the API is not in its `dev` profile |
| Logged out after 15 minutes | The refresh request is failing: check that the API sets the `swipread_refresh` cookie on login (Network tab) and that the frontend and API are same-site |
| The feed only shows "fallback" articles | Normal for the first page of a new reader; the API fills the reader's stock in the background |
| Type errors after pulling | The API spec changed: run `npm run gen:api` |
