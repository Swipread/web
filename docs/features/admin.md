# Administration

Management of article sources and topics, for accounts with the `ADMIN` role. Code: `src/features/admin/`.

On a fresh install there is no topic, so the first admin cannot finish onboarding: the administration stays reachable for admins without topics, and the onboarding's empty state links them to `/admin/themes`. Create the topics there, then pick yours.

## Access

- `RequireAdmin` reads `role` from the cached profile (`GET /v1/me`); readers are sent back to the feed. `/admin` redirects to `/admin/sources`.
- The tab bar shows an « Admin » tab to admins only. It opens the section, and `AdminLayout` shows segmented tabs (Sources, Thèmes) to switch pages, on every screen size.
- The API is the real gate: `/v1/admin/**` answers 403 to readers. The role is carried by the access token, and a renewal reads it from the database again. So on a 403 from `/v1/admin/**` the client renews the token once and replays the request: a reader promoted while logged in reaches the administration at once, without logging in again. If the replay still gets a 403 (demoted admin), the page shows « Vous n'avez pas accès à cette page. ».

## Sources (`/admin/sources`)

**Table**: name, feed URL, language, topics in their order (« Sans thème : non lue » in red when a source has none, since the ingestion skips it), licence (« — » when empty), status, and actions « Désactiver » or « Activer », « Thèmes » and « Supprimer ». Each action button is labelled with the source name for screen readers (« Modifier les thèmes de <name> »).

The status shows the Active / Inactive badge and, below, the ingestion's last read of the feed:

| API fields | Shown |
| --- | --- |
| `lastError` | « Lecture en échec : <message> », in red, translated by `feedReadMessage` like the feed check below (plus `Ingestion failed` → « La lecture a échoué. ») |
| `lastFetchedAt` | « Lue il y a 5 min », « Lue hier »… (`formatRelativeDate`) |
| neither | « Jamais lue » |

The API omits both fields when they are empty, and the types mark `topics` as optional: the screen reads `topics ?? []`.

**Add a source**: « Ajouter une source » focuses the form below the table.

| Field | Rule (`sourceSchema`) |
| --- | --- |
| Nom | Required, ≤ 100 characters |
| URL du site | Required, `http` or `https`, ≤ 2048 characters |
| URL du flux | Same rules; the API downloads it and checks it is an RSS or Atom feed with articles |
| Langue | Two-letter code, sent in lowercase (default `fr`) |
| Licence | Optional, ≤ 200 characters |
| Thèmes | 1 to 3 (`SOURCE_TOPICS_MAX`), in the order they are picked: « Choisissez au moins un thème. » |

**Topics of a source.** `SourceTopicsPicker` lists the topics of the administration (`useAdminTopics`) as `Chip` toggles. Picking one appends it; each picked chip shows its rank in place of the check mark, its accessible name says it (« Culture, thème 2 ») and a line below repeats the order (« 1. Environnement · 2. Culture »). Once three are picked the others are disabled. The order matters: the ingestion gives the source's articles these topics with decreasing confidence, so the first one is their main topic for the recommender. With no topic at all, the picker links to « Créer les thèmes » (`/admin/themes`).

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
| 400 `Unknown topic ids: […]` | On the topics: « Un des thèmes choisis n'existe plus : choisissez-les à nouveau. », and the topic list is reloaded |

The translations live in `feedProblem.ts`; keep them in sync with the API's documented details.

**Activate / deactivate**: `PATCH /v1/admin/sources/{id}` with `{ active }`, then a toast. Inactive sources are skipped by ingestion and no longer feed the feed (recommender and fallback feed); their articles stay in saved lists and history.

**Change the topics**: « Thèmes » opens a dialog with the picker, preselected with the source's topics in their order. « Enregistrer » sends `PATCH /v1/admin/sources/{id}` with `{ topicIds }` (the API accepts a partial update), replaces the source in the cache and shows « Thèmes de « <name> » enregistrés ». An empty selection shows « Choisissez au moins un thème. » without calling the API. The articles already ingested keep their topics; the dialog says so.

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
| `useSetSourceActive()` | `PATCH /v1/admin/sources/{id}` with `{ active }`; replaces the source in the cache |
| `useSetSourceTopics()` | `PATCH /v1/admin/sources/{id}` with `{ topicIds }`; replaces the source in the cache |
| `useDeleteSource()` | `DELETE /v1/admin/sources/{id}`; removes it from the cache |
| `useAdminTopics()` | `['admin', 'topics']`, `GET /v1/admin/topics` |
| `useCreateTopic()` | `POST /v1/admin/topics`; inserts sorted by label, invalidates `['topics']` and `['me']` |
| `useRenameTopic()` | `PATCH /v1/admin/topics/{id}`; replaces and re-sorts, invalidates `['topics']` and `['me']` |

## Tests

`features/admin/admin.test.tsx` (guard, navigation, `/admin` redirect, 403), `sources.test.tsx` (list with topics and last read, source without topics never read, empty state, retry, deactivate, header button focus, add after the feed check with ordered topics, validation, unknown topic (400), 422 and 409, topics changed in a new order, at least one and at most three topics, link when no topic exists, delete, 409 on delete offering deactivation), `adminTopics.test.tsx` (counts, empty state, retry, create and refresh reader topics, 409, letter-or-digit rule, rename, Escape, conflict on rename), `feedProblem.test.ts` (feed check and last read messages).
