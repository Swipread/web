# Administration

Management of article sources and topics, for accounts with the `ADMIN` role. Code: `src/features/admin/`.

## Access

- `RequireAdmin` reads `role` from the cached profile (`GET /v1/me`); readers are sent back to the feed. `/admin` redirects to `/admin/sources`.
- The sidebar shows an « Administration » group (Sources, Thèmes) to admins only. On mobile, one « Admin » tab opens the section and `AdminLayout` shows segmented tabs to switch pages.
- The API is the real gate: `/v1/admin/**` answers 403 to readers. The role is carried by the access token, so a promotion or demotion takes effect at the next token renewal (at most 15 minutes). A 403 shows « Vous n'avez pas accès à cette page. ».

## Sources (`/admin/sources`)

**Table**: name, feed URL, language, licence (« — » when empty), status badge (Active / Inactive), actions « Désactiver » or « Activer » and « Supprimer ». Each action button is labelled with the source name for screen readers.

**Add a source**: « Ajouter une source » focuses the form below the table.

| Field | Rule (`sourceSchema`) |
| --- | --- |
| Nom | Required, ≤ 100 characters |
| URL du site | Required, `http` or `https`, ≤ 2048 characters |
| URL du flux | Same rules; the API downloads it and checks it is an RSS or Atom feed with articles |
| Langue | Two-letter code, sent in lowercase (default `fr`) |
| Licence | Optional, ≤ 200 characters |

« Vérifier et ajouter » shows « Vérification du flux… » while the API downloads and checks the feed, which can take several seconds (5 s to connect and 10 s to answer, per request, redirects included). Errors:

| API answer | Shown on the feed URL field |
| --- | --- |
| 409 | « Une source utilise déjà ce flux. » |
| 422 `Feed is unreachable` | « Le flux est injoignable. » |
| 422 `Feed answered HTTP 404` | « Le flux a répondu par une erreur HTTP 404. » |
| 422 `Not a valid RSS or Atom feed` | « Ce n'est pas un flux RSS ou Atom valide. » |
| 422 `Feed has no articles` | « Le flux ne contient aucun article. » |
| 422 `Feed address is not allowed` | « Adresse refusée : seuls les flux publics en http ou https (ports 80 et 443) sont acceptés. » |
| 422 `Feed redirects too many times` | « Le flux redirige trop de fois. » |
| 422 `Feed is larger than 5 MB` | « Le flux dépasse 5 Mo. » |
| 422, unknown detail | « Le flux n'a pas pu être vérifié : <detail> » |

The translations live in `feedProblem.ts`; keep them in sync with the API's documented details.

**Activate / deactivate**: `PATCH /v1/admin/sources/{id}` with `{ active }`, then a toast. Inactive sources are skipped by ingestion; their articles stay in feeds.

**Delete**: a confirmation dialog, then `DELETE /v1/admin/sources/{id}`. A source that already has articles cannot be deleted (409): deleting its articles would erase readers' saved lists and history. The dialog then explains it and offers « Désactiver la source » instead.

## Topics (`/admin/themes`)

- **Create**: « Nouveau thème » + « Créer le thème ». Rule `topicSchema`: 1–50 characters with at least one letter or digit. A 409 means a topic with the same slug exists: the API derives the slug from the label without accents or case (« Jeux Vidéo » and « jeux video » collide).
- **Table**: name, number of articles, number of interested readers (formatted « 1 284 »), « Renommer ».
- **Rename in place**: the name cell becomes a field (selected text, focus), Enter saves, Escape cancels, focus returns to « Renommer ». Only the label changes; the slug, used by the recommendation service, never does.
- Creating or renaming invalidates the readers' topic list (`['topics']`) and the profile (`['me']`), so the change shows up at once in onboarding and in the profile.

## Hooks

| Hook | Query key / endpoint |
| --- | --- |
| `useSources()` | `['admin', 'sources']`, `GET /v1/admin/sources` |
| `useCreateSource()` | `POST /v1/admin/sources`; inserts the result in the cache, sorted by name |
| `useSetSourceActive()` | `PATCH /v1/admin/sources/{id}`; replaces the source in the cache |
| `useDeleteSource()` | `DELETE /v1/admin/sources/{id}`; removes it from the cache |
| `useAdminTopics()` | `['admin', 'topics']`, `GET /v1/admin/topics` |
| `useCreateTopic()` | `POST /v1/admin/topics`; inserts sorted by label, invalidates `['topics']` and `['me']` |
| `useRenameTopic()` | `PATCH /v1/admin/topics/{id}`; replaces and re-sorts, invalidates `['topics']` and `['me']` |

## Tests

`features/admin/admin.test.tsx` (guard, navigation, `/admin` redirect, 403), `sources.test.tsx` (list, empty state, retry, deactivate, header button focus, add after the feed check, validation, 422 and 409, delete, 409 on delete offering deactivation), `adminTopics.test.tsx` (counts, empty state, retry, create and refresh reader topics, 409, letter-or-digit rule, rename, Escape, conflict on rename), `feedProblem.test.ts`.
