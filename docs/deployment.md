# Deployment

The production build is a static site (`dist/`): an `index.html`, hashed JS and CSS bundles under `assets/`, and the favicon. Any static host works as long as it falls back to `index.html` for client-side routes.

## Requirements

| Concern | Requirement |
| --- | --- |
| API URL | Baked in at build time through `VITE_API_BASE_URL` (Vite inlines it into the bundle). One build per environment |
| Same site | The frontend and the API must share a registrable domain (`app.example.com` + `api.example.com`): the refresh cookie is `SameSite=Strict` and is not sent across sites |
| HTTPS | Required in production: the refresh cookie is `Secure`, and the clipboard API needs a secure context |
| CORS | The API's `SWIPREAD_CORS_ALLOWED_ORIGINS` must list the frontend's exact origin |
| Routing | Unknown paths must serve `index.html` (status 200), so `/sauvegardes` or `/admin/sources` work on reload |

## Example: Docker and Nginx

The two files below have been built and run as shown. Put them at the repository root (they are not committed; adapt them to your infrastructure).

`Dockerfile`:

```dockerfile
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# Serve stage
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
```

`nginx.conf`:

```nginx
server {
    listen 80;
    root /usr/share/nginx/html;

    # Hashed assets never change: cache them for a year
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        try_files $uri =404;
    }

    # Client-side routes (/connexion, /sauvegardes, /admin/sources…) fall back to index.html
    location / {
        add_header Cache-Control "no-cache";
        add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' https: data:; connect-src 'self' https://api.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
        try_files $uri /index.html;
    }
}
```

`.dockerignore`:

```text
node_modules
dist
notes
.env*
!.env.example
.git
```

Build and run:

```bash
docker build --build-arg VITE_API_BASE_URL=https://api.example.com -t swipread-web .
docker run --rm -p 8080:80 swipread-web
```

TLS is expected to be terminated in front of this container (load balancer, ingress or a reverse proxy).

### Notes on the headers

- **`Cache-Control`**: `index.html` is revalidated on every visit (`no-cache`) so a new deployment is picked up at once; bundles are immutable because their names contain a content hash.
- **Content Security Policy**: the app has no inline script or style, so `'self'` is enough for both. `img-src` allows any HTTPS origin because article images come from the sources' own sites. `connect-src` must list the API origin. The policy above was checked in a browser with no violation.
- `frame-ancestors 'none'` prevents clickjacking; add `Strict-Transport-Security` on the HTTPS front.

## Example: continuous integration

A GitHub Actions workflow that runs the same checks as before a pull request (`.github/workflows/ci.yml`, not committed):

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm test
      - run: npm run build
        env:
          VITE_API_BASE_URL: https://api.example.com
```

The test suite needs no API: every request is answered by msw. The API types are committed, so CI does not need the API to be running either; regenerate them locally when the API changes.

## Release checklist

1. `npm test && npm run lint && npm run build` pass.
2. `src/api/schema.d.ts` matches the API version being deployed (`npm run gen:api` against it shows no diff).
3. `VITE_API_BASE_URL` is the production API, over HTTPS.
4. The API lists the frontend origin in `SWIPREAD_CORS_ALLOWED_ORIGINS` and runs with `SWIPREAD_AUTH_REFRESH_COOKIE_SECURE=true`.
5. After deployment: log in, scroll the feed, reload on a deep link (`/sauvegardes`), and check in the Network tab that `/v1/auth/refresh` sets a new cookie.
