# Design tokens

All tokens are CSS custom properties defined in `src/ui/tokens.css`. Components use them exclusively: no hard-coded colour, spacing, radius or duration in a CSS Module. The art direction they serve is described in [Art direction](../design.md).

## Colours

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#ffffff` | `#000000` | Page background |
| `--color-bg-subtle` | `#f5f5f7` | `#111113` | Panels, table headers |
| `--color-surface` | `#ffffff` | `#1c1c1e` | Cards, inputs, dialogs |
| `--color-fill` | `#ececf0` | `#2c2c2e` | Secondary buttons, chips, active nav item |
| `--color-fill-hover` | `#e2e2e7` | `#3a3a3c` | Hover of filled controls |
| `--color-border` | `#d9d9de` | `#38383a` | Borders, separators |
| `--color-text` | `#1d1d1f` | `#f5f5f7` | Body text |
| `--color-text-secondary` | `#5f5f64` | `#a1a1a6` | Meta, hints, captions |
| `--color-primary` | `#1d1d1f` | `#f5f5f7` | Primary buttons, active badges |
| `--color-primary-hover` | `#3a3a3c` | `#d2d2d7` | |
| `--color-on-primary` | `#ffffff` | `#1d1d1f` | Text on primary |
| `--color-ink` | `#111111` | `#ffffff` | The identity's only colour: links, focus ring, text selection |
| `--color-on-ink` | `#ffffff` | `#111111` | Text on ink (selection) |
| `--color-accent` | = `--color-ink` | = `--color-ink` | Links (underlined) |
| `--color-focus` | = `--color-ink` | = `--color-ink` | Focus ring |
| `--color-danger` | `#c4001a` | `#ff6961` | Errors, destructive actions |
| `--color-like` | `#e0244a` | `#ff375f` | Pressed « J'aime » |
| `--color-success` | `#1d7d36` | `#30d158` | Positive feedback |
| `--color-overlay` | `rgb(0 0 0 / 0.4)` | `rgb(0 0 0 / 0.6)` | Dialog backdrop |
| `--shadow-card` | soft drop shadow | 1 px border ring | Feed cards |

The dark values apply under `@media (prefers-color-scheme: dark)`; there is no manual theme switch. Text colours are chosen to meet WCAG AA contrast on their backgrounds in both themes; check any new pairing.

## Typography

| Token | Value |
| --- | --- |
| `--font-sans` | `Schibsted Grotesk Variable` (self-hosted from `@fontsource-variable/schibsted-grotesk`, imported in `src/main.tsx`), then the system stack |
| `--font-size-xs` … `--font-size-2xl` | `0.75rem`, `0.875rem`, `1rem`, `1.25rem`, `1.75rem`, `2.5rem` |
| `--font-weight-regular` … `--font-weight-heavy` | `400`, `500`, `600`, `700`, `800` (titles) |
| `--line-height-tight`, `--line-height-base` | `1.2` (headings), `1.5` (body) |
| `--letter-spacing-tight` | `-0.02em` (headings) |
| `--letter-spacing-title` | `-0.025em` (article titles in the feed) |

## Spacing and radii

| Token | Value |
| --- | --- |
| `--space-1` … `--space-8` | `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4rem` |
| `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill`, `--radius-photo` | `8px`, `12px`, `20px`, `999px`, `16px` (article photo) |

## Layout

| Token | Value | Use |
| --- | --- | --- |
| `--content-max-width` | `1072px` | Page content |
| `--card-max-width` | `640px` | Feed card |
| `--tabbar-height` | `64px` | Bottom tab bar (every screen size), plus the safe area |
| `--feed-topbar-height` | `56px` | The feed's top bar (symbol, « Pour vous ») |
| `--feed-column-width` | `600px` | Width of the feed's reading column |

Breakpoints are plain media queries (not tokens): `900px` (auth pages stack), `768px` (tighter page padding, forms go single-column, no keyboard hint in the feed), `600px` (article rows use a smaller thumbnail), `480px` (dialog buttons stack).

## Motion

| Token | Value |
| --- | --- |
| `--duration-fast` | `150ms` |
| `--duration-base` | `250ms` |
| `--ease-standard` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |
| `--ease-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` (ambiance crossfade, photo settling) |
| `--duration-ambient` | `700ms` (the feed's light changing between two articles) |

Under `prefers-reduced-motion: reduce` the three durations become `0ms`, which turns off every transition built on them. JavaScript scrolling checks the same preference (`prefersReducedMotion()` in `src/lib/media.ts`).

## Ambiance (feed)

The feed's background is the article's own image, blurred and veiled; these tokens cap its brightness so text keeps its contrast whatever the image. Worst cases, computed for an all-white image in dark and an all-black image in light: `--ambient-ink` 8.6:1 (dark) and 9.5:1 (light), `--ambient-ink-2` 6.4:1 and 7.2:1.

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--ambient-filter` | `blur(48px) saturate(1.2) brightness(1.1)` | `blur(48px) saturate(1.4) brightness(0.6)` | Applied to the image layer |
| `--ambient-veil` | `rgb(255 255 255 / 0.72)` | `rgb(0 0 0 / 0.5)` | Layer over the image |
| `--ambient-ink`, `--ambient-ink-2` | `#111111`, `#2b2b2b` | `#ffffff`, white 82 % | Text on the ambiance |
| `--ambient-chip`, `--ambient-chip-hover` | black 7 %, 12 % | white 14 %, 22 % | Round actions, reason chip |
| `--ambient-pill`, `--ambient-on-pill` | `#111111` on `#ffffff` text | `#ffffff`, `#111111` text | « Lire l'article » |
| `--shadow-photo` | soft, 18 % | deep, 45 % | The sharp photo |
| `--topic-<slug>` | two colours per topic (`environment`, `science`, `culture`, `politics`, `economy`, `tech`, `sport`, `health`, `default`) | same | Gradient when an article has no image, and of a chosen topic tile: `linear-gradient(160deg, var(--topic-<slug>))` |
| `--tile-veil` | `rgb(0 0 0 / 0.35)` | same | Veil over a chosen topic tile's gradient (white text ≥ 4.95:1 on every topic) |
| `--tile-ink` | `#ffffff` | same | Text of a chosen topic tile |

These tokens are in place ahead of the redesign; the feed screen does not use them yet.
