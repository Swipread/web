# Feed (« Pour vous »)

The home screen: recommended articles, one card per screen. Code: `src/features/feed/`.

## Anatomy

The feed is immersive: on `/`, `AppLayout` drops the main area's padding (`main[data-immersive]`) and the page fills the window, minus the notice banner (`--notice-height`) and, on mobile, the tab bar. The look follows the « Ambiance » direction ([design.md](../design.md)).

```text
FeedPage
├── AmbientField   the current article's image, blurred and veiled, behind everything (aria-hidden)
├── top bar        BrandSymbol lit by the current article + « Swipread », « Pour vous » (h1), keyboard hint (desktop)
└── scroller (role="feed", scroll-snap)
    ├── article[data-index=0]  ArticleCard (with ArticleActions inside)
    ├── article[data-index=1]  …
    └── end slide[data-index=n]  spinner | « Vous êtes à jour » | error + « Réessayer »
```

- **`AmbientField`**: one layer per article for the current card and its neighbours (so a swipe crossfades, `--duration-ambient`, instead of popping): the image with `--ambient-filter`, or the topic's gradient (`topicField.ts`, `--topic-<slug>`, neutral for other topics) when there is no image or it failed. A neutral base layer and the `--ambient-veil` sit under and over them; the veil caps the contrast whatever the image.
- **`ArticleCard`**: a reading column (max `--feed-column-width`): the 16:9 photo (eager for the first card, lazy afterwards, `referrerPolicy="no-referrer"`), which settles from 96 % when its card becomes current; a meta line in two groups that wrap as wholes (source · topic, then relative date · reading time, the latter left out when `wordCountFromSummary` is true); the title (never rewritten, scaled with the screen's height); the summary; a chip saying why the article is here (`reasonLabel`); the actions; and « Lire l'article chez <source> », which opens the source's page in a new tab. Without an image (or when it fails to load, tracked in `FeedPage`), the photo slot disappears and the title grows. On short screens the photo gives way first (cropped, never squashed), then the summary.
- **`ArticleActions`**: four round `IconButton`s (`variant="ambient"`), named by `aria-label` and `title`: « J'aime » (`aria-pressed`), « Sauvegarder » (`aria-pressed`), « Partager », « Pas intéressé ». A pressed toggle turns to ink.
- **Reason chip** (`reasonLabel.ts`), from the item's `reason`: `similar` « Proche de vos lectures », `onboarding` and `fallback` (both drawn from the reader's topics) « D'après vos centres d'intérêt », `explore` « Pour découvrir autre chose »; any other value shows no chip.
- Each `article` is focusable (`tabIndex=-1`), labelled by its title, and carries `aria-posinset` / `aria-setsize` (`-1` while more pages may come).

## Data

`useFeed()` wraps an infinite query on `['feed']`:

- `GET /v1/feed` with `X-Session-Id` and `X-Device`. There is no cursor: every call consumes the next articles of the reader's stock on the server, so the page parameter is just a counter.
- `getNextPageParam` stops when a page comes back empty (« Vous êtes à jour »).
- `staleTime: Infinity` and `gcTime` 30 min: refetching would replace pages already read by new articles.
- Cards are normalised into `FeedCard` (`articleId`, `liked`, `saved` always set) and deduplicated by `articleId`.
- `updateCard(articleId, patch)` and `removeCard(articleId)` edit the cached pages; `patchFeedCard` does the same from other features (the saved list uses it when an article is unsaved).

## Behaviour

| Concern | Implementation |
| --- | --- |
| Current card | `useActiveIndex`: an `IntersectionObserver` on the scroller with a 60 % threshold reports the `data-index` of the visible slide |
| Keyboard | `useFeedKeyboard`: ↓ / Page Down next, ↑ / Page Up previous; ignored with modifier keys or while typing in a field. A pending target index lets repeated presses keep going during a smooth scroll |
| Motion | `scrollIntoView({ behavior: 'smooth' })`, `auto` when `prefers-reduced-motion` is set |
| Prefetch | When three cards or fewer remain below the current one, the next page is requested (unless one is in flight or the last one failed) |
| Position memory | The current `articleId` goes to `sessionStorage['swipread.feed.articleId']`; on mount the feed scrolls back to it. Cleared when topics change |
| Like / save | Optimistic: the event is queued and the cached card patched at once. There is no rollback: events are retried until the API accepts them |
| Share | See [Sharing](sharing.md); a `share` event is recorded only when something was actually shared |
| Not interested | `hide` event, the card is removed from the cache, and focus moves to the card that took its place |
| Errors | First load: full-screen error with « Réessayer ». Next pages: the end slide shows the error and retries `fetchNextPage` |
| Empty | No card at all: « Votre fil est vide pour le moment » with a link to the profile's topics |

## Events

The feed is the main source of tracking events (`impression`, `view`, `open`, `read`, reactions). They are described in [Tracking](tracking.md).

## Tests

`features/feed/feed.test.tsx`: card content (source, date, reading time, none for a word count taken from the summary), the reason chip, a photo that fails to load and context headers, prefetch before the end, arrow keys (and ignoring them while typing), hide with focus on the next card, like and save toggles, reaction state and topic from the API, position memory and restore, retry on error, empty feed, end of feed. `reasonLabel.test.ts` covers every reason. Tracking from the feed is covered by `features/tracking/feedTracking.test.tsx`.
