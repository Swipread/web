# Authentication

Sign-up, login, email address confirmation, session lifecycle and logout. Code: `src/features/auth/`, `src/lib/session.ts`, `src/api/refresh.ts`, `src/app/guards.tsx`.

## Screens

| Route | Component | Content |
| --- | --- | --- |
| `/connexion` | `LoginPage` | Email, password, « Mot de passe oublié ? », « Se connecter », link to sign-up |
| `/inscription` | `RegisterPage` | Display name, email, password, « Créer mon compte », link to login |
| `/verifier-email?token=…` | `VerifyEmailPage` | Target of the link sent by mail; public, with or without a session |
| `/mot-de-passe-oublie` | `ForgotPasswordPage` | Email, « Recevoir le lien »; public |
| `/reinitialiser-mot-de-passe?token=…` | `ResetPasswordPage` | New password and confirmation; target of the link sent by mail; public |

Both pages render inside `AuthLayout`, as do the email confirmation and password reset pages: a presentation panel next to the form. The panel shows the « Ambiance » idea before any article exists: the eight topics' gradients take turns (6 s each, 2 s crossfades, a pure CSS animation already on its first light when the page opens, still under `prefers-reduced-motion`) under `--tile-veil`, with the symbol, « Swipread » and the tagline in `--tile-ink`. Under 900 px the panel becomes a band above the form. Fields are filled (`TextField`), the submit is the ink `Button`.

Both routes sit behind `RedirectIfAuthenticated`: a reader who already has a session is sent to the `redirect` query parameter or to the feed.

## Hooks

| Hook | Type | Does |
| --- | --- | --- |
| `useSession()` | `useSyncExternalStore` on `session` | Current session or `null`; re-renders on login, logout and changes from other tabs |
| `useMe()` | Query `['me']`, `staleTime` 5 min | `GET /v1/me`: profile, role and chosen topics |
| `useLogin()` | Mutation | `POST /v1/auth/login`, then `session.save(token)` |
| `useRegister()` | Mutation | `POST /v1/auth/register` with the browser locale when it matches `xx-XX`, then `session.save(token)` |
| `useVerifyEmail()` | Mutation | `POST /v1/auth/email/verify` with the link's token (no `Authorization`), then invalidates `['me']` |
| `useResendVerification()` | Mutation | `POST /v1/me/verification-email` |
| `useForgotPassword()` | Mutation | `POST /v1/auth/password/forgot` (no `Authorization`) |
| `useResetPassword()` | Mutation | `POST /v1/auth/password/reset` with the link's token and the new password; then forgets a session kept in this browser (tracker flushed, session and query cache cleared), since the API signed out every session |
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

## Email address confirmation

Sign-up sends a mail with a link to `/verifier-email?token=…`, valid 24 hours. The account works at once; `GET /v1/me` says `emailVerified`.

**Banner.** `EmailVerificationBanner`, at the top of every page of `AppLayout`, shows while `emailVerified` is `false`: « Confirmez votre adresse : un lien a été envoyé à <email>. », with « Renvoyer le lien » and « Plus tard ».

- « Renvoyer le lien »: toast « Nouveau lien envoyé à <email> »; on 429 (a link less than a minute old, or five today) « Un lien vient d’être envoyé. Réessayez dans une minute. »; on 409 (already confirmed, in another tab) the profile is reloaded and the banner goes.
- « Plus tard » hides it until the tab is closed (`sessionStorage`, key `swipread.verifyBanner.dismissed`).
- Its height is published as the CSS variable `--notice-height`, which the feed takes off its full-screen height, so the card still fits the viewport.

**Page `/verifier-email`.** On load it sends the token once (a ref guards against StrictMode's double effect: a token works only once).

| Outcome | Shown |
| --- | --- |
| 204 | « Adresse confirmée », then « Continuer vers Swipread » (`/`) or « Se connecter » without a session |
| 400, or no token | « Ce lien n’est plus valable » (used, expired after 24 h, or replaced by a newer one). With a session: « Recevoir un nouveau lien »; without: a link to log in |
| Other error | The status message and « Réessayer » |

## Forgotten password

**Page `/mot-de-passe-oublie`.** Reached from « Mot de passe oublié ? » on the login page, which carries the email already typed (router state). It sends `POST /v1/auth/password/forgot` and then always shows « Vérifiez vos e-mails »: « Si un compte existe pour <email>, un lien … vient d’y être envoyé. Il est valable une heure. » The API answers 202 whether the address has an account or not, so the page cannot and does not say more. A field error from the API is shown under the email; any other error above the form, which keeps its value.

**Page `/reinitialiser-mot-de-passe?token=…`.** Target of the link sent by mail. Opening it uses nothing: the token is sent only with the new password (`resetPasswordSchema`: 8–72 characters, and a confirmation that must match).

| Outcome | Shown |
| --- | --- |
| 204 | Back to `/connexion` with « Mot de passe modifié. Connectez-vous avec le nouveau. » (router state). A session kept in this browser is forgotten first: the API signed out every session |
| 400 with field errors | The form, with the message under « Nouveau mot de passe » |
| 400 otherwise, or no token | « Ce lien n’est plus valable » (used, expired after 1 hour, or replaced), with « Recevoir un nouveau lien » (`/mot-de-passe-oublie`) |
| Other error | The status message above the form |

Both pages are public, outside `RedirectIfAuthenticated`: the link may be opened on any device.

## Session

`src/lib/session.ts` stores `{ accessToken, userId, expiresAt }` under `localStorage['swipread.session']` (in memory if storage is unavailable). It is a small external store:

- `get()` returns the cached session; it does **not** drop an expired access token, which is renewed instead.
- `save(token)` computes `expiresAt` from `expiresIn` (seconds) and notifies subscribers.
- `clear()` removes it.
- A `storage` listener keeps tabs in sync: logging out in one tab logs out the others.

The refresh token is never visible to JavaScript: it is the `swipread_refresh` cookie (HttpOnly, `SameSite=Strict`, path `/v1/auth`). Renewal is described in [Backend integration](../backend-integration.md#authentication) and [Flows](../flows.md#token-renewal-across-tabs).

## End of session

A session ends when:

- the reader clicks « Se déconnecter » on the profile page (`useLogout`);
- a request still gets a 401 after a renewal attempt, or the renewal itself is refused: the client clears the session and `createUnauthorizedHandler` clears the query cache and navigates to `/connexion?redirect=<current page>`;
- the account is deleted from the profile page.

## Tests

`features/auth/auth.test.tsx` (client-side validation, generic message on wrong credentials, return to the requested page, password length, email already used, server field errors, new reader sent to onboarding, guards, logout revoking the refresh token), `features/auth/passwordReset.test.tsx` (link from login carrying the typed email, request without `Authorization` and the same answer for any address, validation and server error; reset sending token and password then the login notice, a session in this browser forgotten, rules and confirmation checked before sending, used or expired link offering a new one, rejected password keeping the form, no token), `features/auth/emailVerification.test.tsx` (banner hidden once confirmed, shown and resending, 429 message, « Plus tard » and `--notice-height`; page confirming without a session and without `Authorization`, refreshing the profile with one, invalid link with a new one offered, no token), `lib/session.test.ts`, `api/client.test.ts` (token renewal), `app/unauthorized.test.ts`.
