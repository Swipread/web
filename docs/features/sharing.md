# Sharing

Shares an article's link from the feed or the saved list. Code: `src/features/share/`.

## Behaviour

`shareArticle({ title, url })` returns how the share went:

| Result | When | What the reader sees |
| --- | --- | --- |
| `native` | `navigator.share` exists, `navigator.canShare` accepts the data, and the reader picks a target | The system share sheet |
| `cancelled` | The reader dismisses the share sheet (`AbortError`) | Nothing; the link is **not** copied |
| `clipboard` | No share sheet, or it failed for another reason (for example no user activation) | Toast « Lien copié » |
| `failed` | The clipboard is not available either | Toast « Impossible de partager ce lien. » |

`useShare()` wraps it with the toasts. Callers record a `share` event with `payload.channel` set to `native` or `clipboard`, and nothing for `cancelled` or `failed`.

## Notes

- Support for the share sheet varies by browser and platform (it is common on mobile, rarer on desktop): the clipboard fallback is the normal path on many desktops.
- The clipboard API needs a secure context: `http://localhost` qualifies; any other plain-HTTP origin will get `failed`.

## Tests

`features/share/shareArticle.test.ts` covers the five outcomes (native, cancelled without copying, no share sheet, share sheet failure, clipboard failure). `features/tracking/feedTracking.test.tsx` checks that the feed records `share` with its channel, and nothing when the sheet is dismissed.
