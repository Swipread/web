# Deployment

The production build is a static site (`dist/`): an `index.html`, hashed JS and CSS bundles under `assets/`, and the favicon. Any static host works as long as it falls back to `index.html` for client-side routes.

## Requirements

| Concern | Requirement |
| --- | --- |
| API URL | Baked in at build time through `VITE_API_BASE_URL` (Vite inlines it into the bundle). One build per environment |
| Same site | The frontend and the API must be on one origin (`/` and `/v1` behind one reverse proxy, as in production) or share a registrable domain (`app.example.com` + `api.example.com`): the refresh cookie is `SameSite=Strict` and is not sent across sites |
| HTTPS | Required in production: the refresh cookie is `Secure`, and the clipboard API needs a secure context |
| CORS | The API's `SWIPREAD_CORS_ALLOWED_ORIGINS` must list the frontend's exact origin, including its port. This also applies on a single origin behind a TLS proxy: the API sees plain HTTP, so it treats the browser's `https` origin as cross-origin |
| Routing | Unknown paths must serve `index.html` (status 200), so `/sauvegardes` or `/admin/sources` work on reload |

## Docker image

The repository ships a production image: [`Dockerfile`](../Dockerfile) (build with Node 22, serve with Nginx 1.30), [`docker/nginx.conf`](../docker/nginx.conf) and [`.dockerignore`](../.dockerignore).

```bash
docker build --build-arg VITE_API_BASE_URL=https://swipread.example -t swipread-web .
docker run --rm -p 8080:80 swipread-web
```

- `VITE_API_BASE_URL` is required and must be an origin (scheme, host, optional port, no path): the build fails otherwise. It is baked into the bundle and written into the Content Security Policy (`connect-src 'self' <origin>`), so the image only works with that API.
- The image holds the static files and Nginx only (about 60 MB). Nginx does not announce its version.
- The base images are pinned to a minor version (`node:22-alpine`, `nginx:1.30-alpine`), so each new image picks up their security fixes.
- TLS is terminated in front of the container (a reverse proxy).

In production, Swipread runs this image behind Caddy on a single origin: the web app on `/`, the API on `/v1`. The image was checked that way in a browser: sign-up, refresh cookie, reload, deep links, no console error and no CSP violation.

### Notes on the headers

- **`Cache-Control`**: `index.html` is revalidated on every visit (`no-cache`) so a new deployment is picked up at once; bundles are immutable because their names contain a content hash.
- **Content Security Policy**: the app has no inline script or style, so `'self'` is enough for both. `img-src` allows any HTTPS origin because article images come from the sources' own sites. `connect-src` allows the API origin given at build time.
- `frame-ancestors 'none'` prevents clickjacking. `Strict-Transport-Security` is set by the HTTPS front.

## Continuous integration

GitHub Actions runs [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) on every push to `main` and on every pull request. It runs the same checks as before a pull request — `npm ci`, `npm run lint`, `npm test`, `npm run build` — on Node 22 and 24, the supported versions. A new push to the same branch cancels the run in progress.

The test suite needs no API: every request is answered by msw. The API types are committed, so CI does not need the API to be running either; regenerate them locally when the API changes. The build uses a placeholder `VITE_API_BASE_URL`, since the URL is only baked into the bundle: CI checks that the app builds, it does not deploy it.

## Release checklist

1. `npm test && npm run lint && npm run build` pass.
2. `src/api/schema.d.ts` matches the API version being deployed (`npm run gen:api` against it shows no diff).
3. `VITE_API_BASE_URL` is the production API, over HTTPS.
4. The API lists the frontend origin in `SWIPREAD_CORS_ALLOWED_ORIGINS` and runs with `SWIPREAD_AUTH_REFRESH_COOKIE_SECURE=true`.
5. After deployment: log in, scroll the feed, reload on a deep link (`/sauvegardes`), and check in the Network tab that `/v1/auth/refresh` sets a new cookie.
