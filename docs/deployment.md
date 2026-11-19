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

## Production

Swipread runs on a single server with Docker Compose: Caddy in front (HTTPS with a Let's Encrypt certificate, HSTS), this image on `/`, the API on `/v1`, PostgreSQL and Redis on the internal network only. Web and API share one origin, so the refresh cookie needs nothing more. The server's configuration (Compose file, Caddy, deploy and backup scripts, server setup) lives in the organisation's private `infra` repository; the only production value in this repository is the `APP_ORIGIN` variable.

## Releasing

A release is a version tag on a commit of `main`. It deploys to production:

```bash
git switch main && git pull
git tag -a v1.2.0 -m "Swipread web 1.2.0"
git push origin v1.2.0
```

Only admins can create, move or delete `v*` tags (a tag ruleset). A tag with a suffix, such as `v1.2.0-rc.1`, makes a pre-release, deployed the same way.

The [`Release`](../.github/workflows/release.yml) workflow then runs:

| Job | Does |
| --- | --- |
| Check the tag | The tag is a version (`v1.2.0`) and points to a commit of `main` |
| Checks | The [CI](#continuous-integration) workflow, reused as is |
| Build and publish the image | Builds the [Docker image](#docker-image) for `linux/amd64` with `VITE_API_BASE_URL` set to `APP_ORIGIN`, and pushes `ghcr.io/swipread/web:<version>` (public, like the code) |
| Deploy to production | Connects to the server over SSH. The key can only ask for `deploy web <version>`: the server pulls the image, starts it, and waits until it serves the app; if it does not within 2 minutes, it restores the previous version and the job fails |
| Create the GitHub release | With notes generated by GitHub (merged pull requests, link to the full changelog), only once the deployment is healthy |

One release runs at a time. When a job fails, there is no GitHub release and the previous version keeps running: fix the cause, then *Re-run failed jobs* (the image is rebuilt from the same commit) or push a new tag. Rolling back to an earlier version is done on the server (see the `infra` repository).

### GitHub settings

| Where | Name | Value |
| --- | --- | --- |
| Repository variable | `APP_ORIGIN` | Public origin of the app, e.g. `https://swipread.example`: baked into the bundle and the CSP, and the environment's link |
| Environment `production` (deployments from `v*` tags only), variable | `DEPLOY_HOST` | The server's hostname |
| Environment `production`, secret | `DEPLOY_SSH_KEY` | Private half of the release key pair, restricted on the server to the deploy command |
| Environment `production`, secret | `DEPLOY_KNOWN_HOSTS` | The server's host key, checked against the fingerprint read on the server: a release never trusts an unknown host |

Because the environment only accepts `v*` tags, a workflow started from a branch or a pull request cannot read the deploy key.

### Learnt from the first release

- A new package on GHCR is created **private**: the first deployment of a new image fails with `unauthorized` until an organisation owner makes it public (the package's settings → *Change visibility*). GitHub offers no API for this.
- The API must allow exactly `APP_ORIGIN` (`SWIPREAD_CORS_ALLOWED_ORIGINS`), port included: behind the TLS proxy it sees plain HTTP, so it treats the browser's `https` origin as cross-origin and answers 403 otherwise.

## Release checklist

1. CI is green on the commit to tag.
2. `src/api/schema.d.ts` matches the API in production (`npm run gen:api` against it shows no diff). When the web app needs a new API version, release the API first.
3. Tag, push the tag and follow the `Release` workflow until the GitHub release exists.
4. After deployment: the app loads over HTTPS, log in, reload on a deep link (`/sauvegardes`), no CSP error in the browser console, and `/v1/auth/refresh` sets a new cookie (Network tab).
