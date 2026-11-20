# UI components

Shared components live in `src/ui/`. They only use design tokens (see [Design tokens](design-tokens.md)), carry their own accessibility, and know nothing about features.

## Button

```tsx
<Button variant="secondary" loading={mutation.isPending} onClick={save}>Enregistrer</Button>
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `'primary' \| 'secondary' \| 'ghost' \| 'danger'` | `'primary'` | `danger` is outlined in the danger colour |
| `loading` | `boolean` | `false` | Shows a spinner, disables the button and sets `aria-busy` |
| `fullWidth` | `boolean` | `false` | |
| `type` | button type | `'button'` | Never submits a form by accident |
| …rest | `ButtonHTMLAttributes` | | `aria-label`, `onClick`, `disabled`… |

## IconButton

Round icon button, used for the feed actions and row actions.

```tsx
<IconButton icon={<HeartIcon filled={liked} />} label="J'aime" showLabel tone="like" pressed={liked} onClick={toggle} />
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `icon` | `ReactNode` | | Decorative SVG |
| `label` | `string` | required | Accessible name. Rendered under the icon when `showLabel`, otherwise used as `aria-label` |
| `showLabel` | `boolean` | `false` | |
| `pressed` | `boolean` | | Sets `aria-pressed`: use it for toggles |
| `tone` | `'default' \| 'like'` | `'default'` | `like` colours the pressed state |
| `size` | `'md' \| 'sm'` | `'md'` | `sm`: a 40px circle, for list rows |
| `variant` | `'default' \| 'ambient'` | `'default'` | `ambient`: larger translucent circle for the feed's ambient field (`--ambient-*`); pressed turns to ink |

## BrandSymbol

« Les guillemets qui montent », the Swipread symbol, decorative (`aria-hidden`).

```tsx
<BrandSymbol size={28} light={<img src={imageUrl} alt="" />} />
```

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `size` | `number` | `28` | Side in pixels |
| `light` | `ReactNode` | | Fills the lower guillemet (cut out with `clip-path`): the feed passes the current article's image or its topic gradient. Without it the symbol is monochrome, as on the app icon |

## TextField

Label, input, hint and error, wired together for assistive technology.

```tsx
<TextField label="Email" type="email" error={errors.email?.message} {...register('email')} />
```

| Prop | Type | Notes |
| --- | --- | --- |
| `label` | `string` | Required, always rendered (visually hidden with `hideLabel`) |
| `hint` | `string` | Shown under the input when there is no error; linked with `aria-describedby` |
| `error` | `string` | Sets `aria-invalid` and is linked with `aria-describedby` |
| `hideLabel` | `boolean` | Keeps the label for screen readers only (for example inside a table row) |
| `ref` | `Ref<HTMLInputElement>` | React 19 ref prop, works with React Hook Form's `register` |

## Chip

Toggle pill used by the source topics picker (administration). Props: `selected` (sets `aria-pressed` and shows a marker), `marker` (what is shown when selected, a check mark by default; the source picker shows the topic's rank), plus button attributes. A disabled chip is dimmed and shows a `not-allowed` cursor.

## ConfirmDialog

Modal confirmation built on the native `<dialog>` (focus trap and Escape for free). The cancel button gets the initial focus, so Enter never confirms by accident.

```tsx
<ConfirmDialog
  open={confirming}
  title="Supprimer votre compte ?"
  confirmLabel="Supprimer définitivement"
  danger
  pending={deletion.isPending}
  error={deletion.isError ? getErrorMessage(deletion.error) : null}
  onConfirm={() => deletion.mutate()}
  onCancel={close}
>
  <p>Cette action est irréversible.</p>
</ConfirmDialog>
```

| Prop | Notes |
| --- | --- |
| `open` | Controlled: the parent owns the state; Escape calls `onCancel` |
| `title`, `children` | Linked as `aria-labelledby` and `aria-describedby` |
| `confirmLabel`, `cancelLabel` | `cancelLabel` defaults to « Annuler » |
| `danger` | Destructive style for the confirm button |
| `pending` | Spinner on confirm, cancel disabled, Escape ignored |
| `error` | Shown in an `alert` above the buttons |

Under 480 px the buttons stack vertically.

## State components

| Component | Use |
| --- | --- |
| `LoadingState` | Centred spinner with an announced label (« Chargement… » by default) |
| `ErrorState` | « Une erreur est survenue », the message, and « Réessayer » when `onRetry` is given (`retrying` shows a spinner). Rendered with `role="alert"` |
| `EmptyState` | Title, optional description and action (a link back to the feed, for example) |
| `Spinner` | `size` `sm`/`md`; `label` is announced, pass `null` when the parent already conveys the busy state |

Every screen uses the three states: see [Contributing](../contributing.md#conventions).

## PageHeader

`title` (the page's `h1`), optional `subtitle` and `actions` (right-aligned, wraps under the title on narrow screens).

## ArticleRow

One article in a list (saved, history): 16:9 thumbnail, meta, title, then the caption and the actions on one line. The title's link stretches over the whole row (it opens the source in a new tab); the actions sit above it, and keyboard focus on the link rings the row.

| Prop | Notes |
| --- | --- |
| `title`, `url`, `imageUrl` | Without an image, or when it fails to load, the thumbnail takes the topic's gradient |
| `topicSlug` | First topic's slug, for that gradient (`src/ui/topicField.ts`, shared with the feed) |
| `meta` | What the article is, joined by a dot, e.g. `['Le Journal Tech', 'Sciences']`; empty parts are dropped |
| `caption` | When it happened and how long it reads, e.g. `['Sauvegardé hier', <ReadingTime … />]` |
| `actions` | Round icon buttons (`size="sm"`), right of the caption |
| `onOpen` | Called when the title link is followed (to record `open`) |
| `headingLevel` | `2` (default) or `3` when rows sit under section headings |

## ReadingTime

`<ReadingTime wordCount={…} fromSummary={…} />` shows « 4 min » and keeps « de lecture » for screen readers; it renders nothing when the length is unknown or comes from the summary. Used by the feed card and the list rows; check `formatReadingTime(…)` first when it sits in a list joined by dots.

## Toasts

`ToastProvider` (in `main.tsx` and the test render helpers) renders one polite live region. `useToast().show(message)` displays a short confirmation for four seconds; a new message replaces the current one. It appears at the top, under the top bar: the bottom of the screen holds the tab bar and, on the feed, the actions.

## Icons

`src/ui/icons/index.tsx`: `HomeIcon`, `HeartIcon` (`filled`), `BookmarkIcon` (`filled`), `ShareIcon`, `CloseIcon`, `ClockIcon`, `UserIcon`, `RssIcon`, `TagIcon`, `SlidersIcon`, `LogoutIcon`, `ArrowDownIcon`, `CheckIcon`. All are 24×24 stroke icons drawn in `currentColor`, `aria-hidden` by default: the control that contains them carries the label. Add new icons there rather than pulling an icon library.

## Global helpers

`src/ui/global.css` defines the `.visually-hidden` class (content for screen readers only, such as « (nouvel onglet) » after external links) and the focus ring.
