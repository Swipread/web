# Profile (« Profil »)

Account details, topics and account deletion. Code: `src/features/profile/`.

## Screen

`/profil` → `ProfilePage`, three sections:

1. **Informations**: « Nom affiché » (editable) and « Email (non modifiable) » (read-only). « Enregistrer » is enabled only when the name changed.
2. **Centres d'intérêt**: the onboarding `TopicPicker`, aligned left, with the same three-topic rule and « Enregistrer mes thèmes ».
3. **Supprimer mon compte**: an explanation and a button that opens a confirmation dialog.

The page waits for the profile (`useMe`); while it loads or fails it shows the usual loading and error states.

## Display name

- Validated with `profileSchema` (`displayName`: trimmed, 1–50 characters, shared with sign-up).
- `useUpdateProfile()`: `PATCH /v1/me`, then writes the returned profile into the `['me']` cache. The form is reset to the name the server saved (it trims it) and the toast « Nom enregistré » appears.
- A 400 on `displayName` is shown on the field; other errors above the button.

## Topics

Same hooks as onboarding (`useTopics`, `useUpdateTopics`, `useTopicSelection`). Saving resets the cached feed and its position, then shows « Centres d'intérêt enregistrés ».

## Account deletion

1. « Supprimer mon compte » opens `ConfirmDialog` (« Supprimer votre compte ? »), with the focus on « Annuler » so Enter never deletes by accident.
2. « Supprimer définitivement » calls `useDeleteAccount()`: `DELETE /v1/me`.
3. On success: pending events are dropped (the server deletes the reader's data anyway), the session and the query cache are cleared, the app goes to `/connexion` and shows « Votre compte a été supprimé ».
4. On failure the dialog stays open and shows the error.

The API deletes the account, topics, saved articles, history, events and refresh tokens, and tells the recommendation service. The access token is refused right away.

## Tests

`features/profile/profile.test.tsx`: name and email shown, topic update resetting the feed, failed update, retry, name saved, name validation, server validation error on the field, deletion confirmed or cancelled, error inside the dialog.
