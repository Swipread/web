# Design tokens

All tokens are CSS custom properties defined in `src/ui/tokens.css`. Components use them exclusively: no hard-coded colour, spacing, radius or duration in a CSS Module.

## Colours

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--color-bg` | `#ffffff` | `#000000` | Page background |
| `--color-bg-subtle` | `#f5f5f7` | `#111113` | Sidebar, panels, table headers |
| `--color-surface` | `#ffffff` | `#1c1c1e` | Cards, inputs, dialogs |
| `--color-fill` | `#ececf0` | `#2c2c2e` | Secondary buttons, chips, active nav item |
| `--color-fill-hover` | `#e2e2e7` | `#3a3a3c` | Hover of filled controls |
| `--color-border` | `#d9d9de` | `#38383a` | Borders, separators |
| `--color-text` | `#1d1d1f` | `#f5f5f7` | Body text |
| `--color-text-secondary` | `#5f5f64` | `#a1a1a6` | Meta, hints, captions |
| `--color-primary` | `#1d1d1f` | `#f5f5f7` | Primary buttons, active badges |
| `--color-primary-hover` | `#3a3a3c` | `#d2d2d7` | |
| `--color-on-primary` | `#ffffff` | `#1d1d1f` | Text on primary |
| `--color-accent` | `#0066cc` | `#2997ff` | Links |
| `--color-focus` | `#0071e3` | `#2997ff` | Focus ring |
| `--color-danger` | `#c4001a` | `#ff6961` | Errors, destructive actions |
| `--color-like` | `#e0244a` | `#ff375f` | Pressed « J'aime » |
| `--color-success` | `#1d7d36` | `#30d158` | Positive feedback |
| `--color-overlay` | `rgb(0 0 0 / 0.4)` | `rgb(0 0 0 / 0.6)` | Dialog backdrop |
| `--shadow-card` | soft drop shadow | 1 px border ring | Feed cards |

The dark values apply under `@media (prefers-color-scheme: dark)`; there is no manual theme switch. Text colours are chosen to meet WCAG AA contrast on their backgrounds in both themes; check any new pairing.

## Typography

| Token | Value |
| --- | --- |
| `--font-sans` | System stack: `-apple-system`, `BlinkMacSystemFont`, `SF Pro Text`, `Segoe UI`, `system-ui`, `Roboto`… |
| `--font-size-xs` … `--font-size-2xl` | `0.75rem`, `0.875rem`, `1rem`, `1.25rem`, `1.75rem`, `2.5rem` |
| `--font-weight-regular` … `--font-weight-bold` | `400`, `500`, `600`, `700` |
| `--line-height-tight`, `--line-height-base` | `1.2` (headings), `1.5` (body) |
| `--letter-spacing-tight` | `-0.02em` (headings) |

## Spacing and radii

| Token | Value |
| --- | --- |
| `--space-1` … `--space-8` | `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem`, `3rem`, `4rem` |
| `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-pill` | `8px`, `12px`, `20px`, `999px` |

## Layout

| Token | Value | Use |
| --- | --- | --- |
| `--sidebar-width` | `240px` | Desktop sidebar |
| `--content-max-width` | `1072px` | Page content |
| `--card-max-width` | `640px` | Feed card |
| `--tabbar-height` | `64px` | Mobile tab bar |

Breakpoints are plain media queries (not tokens): `1024px` (tighter page padding), `900px` (auth pages stack), `768px` (sidebar becomes a tab bar, forms go single-column), `600px` (article rows use a smaller thumbnail), `480px` (dialog buttons stack).

## Motion

| Token | Value |
| --- | --- |
| `--duration-fast` | `150ms` |
| `--duration-base` | `250ms` |
| `--ease-standard` | `cubic-bezier(0.25, 0.1, 0.25, 1)` |

Under `prefers-reduced-motion: reduce` both durations become `0ms`, which turns off every transition built on them. JavaScript scrolling checks the same preference (`prefersReducedMotion()` in `src/lib/media.ts`).
