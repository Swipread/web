# Authentication

Sign-up, login, session lifecycle and logout. Code: `src/features/auth/`, `src/lib/session.ts`, `src/api/refresh.ts`, `src/app/guards.tsx`.

## Screens

| Route | Component | Content |
| --- | --- | --- |
| `/connexion` | `LoginPage` | Email, password, « Se connecter », link to sign-up |
| `/inscription` | `RegisterPage` | Display name, email, password, « Créer mon compte », link to login |

Both pages render inside `AuthLayout`: a presentation panel (brand, tagline, decorative card stack) next to the form. Under 900 px the panel moves above the form.

Both routes sit behind `RedirectIfAuthenticated`: a reader who already has a session is sent to the `redirect` query parameter or to the feed.

## Hooks

| Hook | Type | Does |
| --- | --- | --- |
| `useSession()` | `useSyncExternalStore` on `session` | Current session or `null`; re-renders on login, logout and changes from other tabs |
| `useMe()` | Query `['me']`, `staleTime` 5 min | `GET /v1/me`: profile, role and chosen topics |
| `useLogin()` | Mutation | `POST /v1/auth/login`, then `session.save(token)` |
| `useRegister()` | Mutation | `POST /v1/auth/register` with the browser locale when it matches `xx-XX`, then `session.save(token)` |
| `useLogout()` | Callback | Flushes events, calls `POST /v1/auth/logout`, clears session and cache, goes to `/connexion` |

## Login

1. The form is validated with `loginSchema` (Zod): email required and well-formed, password required.
2. `useLogin` posts the credentials. The client sends this request with `credentials: 'include'` so the browser stores the refresh cookie.
3. On success the session is saved. Nothing navigates explicitly: `RedirectIfAuthenticated` re-renders, reads `?redirect=` with `getRedirectTarget` and replaces the location.
4. `RequireOnboarding` then loads `/v1/me` and sends a reader without topics to `/centres-interet`.

Errors: a 401 shows the generic « Email ou mot de passe incorrect. » (never which field is wrong); other failures show the status message from `getErrorMessage`.

`getRedirectTarget` only accepts in-app paths (starting with `/` but not `//`), so a crafted link cannot redirect to another site after login.

## Sign-up

Validated with `registerSchema`:

| Field | Rule (mirrors the API) |
| --- | --- |
| `displayName` | Trimmed, 1–50 characters |
| `email` | Trimmed, ≤ 254 characters, valid email |
| `password` | 8–72 characters (bcrypt limit) |

Server errors are mapped back onto the form: 409 → « Cet email est déjà utilisé. » on the email field, 400 → a French message per field from `errors[].code`. Anything else is shown above the form. A new account always lands on the topic picker.

## Session

`src/lib/session.ts` stores `{ accessToken, userId, expiresAt }` under `localStorage['swipread.session']` (in memory if storage is unavailable). It is a small external store:

- `get()` returns the cached session; it does **not** drop an expired access token, which is renewed instead.
- `save(token)` computes `expiresAt` from `expiresIn` (seconds) and notifies subscribers.
- `clear()` removes it.
- A `storage` listener keeps tabs in sync: logging out in one tab logs out the others.

The refresh token is never visible to JavaScript: it is the `swipread_refresh` cookie (HttpOnly, `SameSite=Strict`, path `/v1/auth`). Renewal is described in [Backend integration](../backend-integration.md#authentication) and [Flows](../flows.md#token-renewal-across-tabs).

## End of session

A session ends when:

- the reader clicks « Se déconnecter » (`useLogout`);
- a request still gets a 401 after a renewal attempt, or the renewal itself is refused: the client clears the session and `createUnauthorizedHandler` clears the query cache and navigates to `/connexion?redirect=<current page>`;
- the account is deleted from the profile page.

## Tests

`features/auth/auth.test.tsx` (client-side validation, generic message on wrong credentials, return to the requested page, password length, email already used, server field errors, new reader sent to onboarding, guards, logout revoking the refresh token), `lib/session.test.ts`, `api/client.test.ts` (token renewal), `app/unauthorized.test.ts`.
