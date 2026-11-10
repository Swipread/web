# Onboarding (topics)

A new reader chooses at least three topics before seeing the feed. The same picker edits topics later from the profile. Code: `src/features/onboarding/`.

## Screen

`/centres-interet` → `TopicsPage`, behind `RequireAuth` only (not `RequireOnboarding`, which redirects here).

- Title « Qu'est-ce qui vous intéresse ? » and the rule « Choisissez au moins 3 thèmes ».
- `TopicPicker`: one `Chip` (toggle button with `aria-pressed`) per topic, in the order returned by the API.
- A live counter (`aria-live="polite"`) from `selectionLabel`: « 2 thèmes sélectionnés · encore 1 à choisir ».
- « Continuer vers mon fil » stays disabled below three topics.
- States: loading, error with « Réessayer », and an empty state if the API has no topics yet.

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

`features/onboarding/onboarding.test.tsx` (three-topic minimum, save and redirect to the feed, save error, retry on load error, no topic available), `selectionLabel.test.ts`, and the topics section of `features/profile/profile.test.tsx`.
