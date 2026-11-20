# Onboarding (topics)

A new reader chooses at least three topics before seeing the feed. The same picker edits topics later from the profile. Code: `src/features/onboarding/`.

## Screen

`/centres-interet` → `TopicsPage`, behind `RequireAuth` only (not `RequireOnboarding`, which redirects here).

- The app's top bar (symbol and name), the title « Qu'est-ce qui vous intéresse ? » and the rule « Choisissez au moins 3 thèmes : votre fil commence par eux, puis apprend de vos lectures… », in one centred 48rem column.
- `TopicPicker`: a grid of tiles, one toggle button (`aria-pressed`) per topic, in the order returned by the API. An unchosen tile shows the topic's colours as a small swatch; a chosen one lights up with the topic's gradient (`src/ui/topicField.ts`, the colours the feed uses for that topic's articles without an image, neutral for topics without their own) under `--tile-veil`, with white text and a check mark. The veil keeps white text at 4.95:1 or more on every topic (Économie's yellow is the worst case). Long names hyphenate (French).
- A footer pinned at the bottom: the live counter (`aria-live="polite"`) from `selectionLabel` (« 2 thèmes sélectionnés · encore 1 à choisir ») and « Continuer vers mon fil », disabled below three topics.
- States: loading, error with « Réessayer », and an empty state if the API has no topics yet. For an admin, that empty state links to « Créer les thèmes » (`/admin/themes`), which `RequireOnboarding` lets admins reach without topics: otherwise the first admin of a fresh install could never create the topics they must pick.

If the reader already has topics (they came back to this page), they are preselected.

## Hooks and helpers

| Name | Does |
| --- | --- |
| `useTopics()` | Query `['topics']`: `GET /v1/topics` |
| `useUpdateTopics()` | Mutation: `PUT /v1/me/topics` with `{ topicIds }`. On success: writes the topics into the cached profile, removes the cached feed and clears the remembered feed position |
| `useTopicSelection(initial)` | Local selection as a `Set<number>`, seeded from `initial` until the reader changes it; exposes `toggle`, `reset` and `isDirty` |
| `selectionLabel(count, min)` | The French counter text |
| `MIN_TOPICS` | `3`, the rule shared with the API (it answers 400 below three) |

## Why the feed is reset

The API empties the reader's stock of prepared articles when topics change, and the next `GET /v1/feed` starts from the new topics. The frontend matches it: `useUpdateTopics` removes the `['feed']` query and the saved position, so the feed starts over instead of showing pages computed from the old topics.

## Tests

`features/onboarding/onboarding.test.tsx` (three-topic minimum, save and redirect to the feed, save error, retry on load error, no topic available, an admin led to the topics administration on a fresh install, readers kept out of it), `selectionLabel.test.ts`, and the topics section of `features/profile/profile.test.tsx`.
