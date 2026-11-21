# Art direction

Swipread's visual identity, decided in November 2026 (art direction steps D1 to D4). It replaces the earlier « sober, Apple-inspired » style. The screens move to it during the redesign that follows; until then this page describes the target and `src/ui/tokens.css` already carries its tokens.

It rests on these product facts: general-public readers in idle moments, mostly on a phone; « read rather than scroll » and a recommendation that explains itself; the source always credited; accessibility beyond WCAG AA.

## The idea: « Ambiance »

Every article sets its own ambiance. The screen takes the colours of the article's photo, and each swipe changes the light.

- **The image leads.** The article's photo sits at the top, sharp, at its own 16:9, rounded and lifted by a deep shadow. Images come from the publishers' feeds (`imageUrl`); franceinfo's are small (432×243), so they are never stretched to fill the screen.
- **The background is the same image**, heavily blurred, saturated and veiled. Nothing is sampled in JavaScript: the field is the image itself under a CSS filter.
- **One article per screen, swiped vertically**, as on short-video apps. This gesture is binding for any future design.
- **No costume.** The app does not pretend to be a newspaper, a stamp or a departure board: it is an app, uncluttered, current.

Craft bar: Spotify and Apple Music (colour drawn from the content, large type), Arc, Linear and Notion (precision and finish), TikTok and Instagram (immersive full screen, interface that recedes).

## Identity: ink only

Swipread has **no brand colour**. The interface is ink: near-black `#111111` in the light theme, white in the dark theme. The only colour in Swipread is the article's: the ambiance, and the symbol in the feed's top bar, lit by the current article.

Ink carries links (underlined), the focus ring and text selection (`--color-ink`, `--color-on-ink`). Functional colours stay: errors (`--color-danger`) and the pressed « J'aime » (`--color-like`) until the redesign revisits it.

## The symbol: rising guillemets

![The symbol](images/brand/symbol.svg)

Two French guillemets « » turned upward. The guillemet is the press's mark, the way a headline or a quote is set in French; pointing up, it becomes the swipe gesture. News and gesture in one sign.

| Use | Rendering | File |
| --- | --- | --- |
| Favicon | White guillemets on a `#111` rounded square, the lower one at 50 % | `public/favicon.svg` |
| App icon (iOS home screen) | Same, square (the system rounds it) | `public/apple-touch-icon.png` (180 px), `public/icon-512.png` |
| Next to the name | Ink guillemets, the lower one at 45 %, no ground | `docs/images/brand/symbol.svg` |
| Feed top bar | The lower guillemet filled with the current article's colours | Built in the redesign |

The PNG icons are rendered from the SVG by headless Chromium; each file carries its origin in a PNG text chunk. The name stays « Swipread », set in the typeface below at weight 800, tracking -0.03em, next to the symbol.

## Typography

**Schibsted Grotesk**, a variable grotesque designed for a news group, from headlines to interface. It is free (SIL Open Font License), self-hosted from `@fontsource-variable/schibsted-grotesk` (the CSP allows no font host), one file covering weights 400 to 900.

| Role | Weight | Notes |
| --- | --- | --- |
| Article titles | 800 (`--font-weight-heavy`) | Tracking `--letter-spacing-title` (-0.025em), balanced lines |
| Interface (buttons, metadata, navigation) | 600 | |
| Summaries and text | 400 | Line height 1.5 |
| Times and counts | | Tabular figures |

Titles and summaries are always the publisher's, never shortened or rewritten.

## The feed screen

From top to bottom on a phone: a top bar with the symbol, the name and « Pour vous »; the photo; source, topic and reading time; the title; the summary (three lines at most); why the article is recommended (« Proche de vos lectures », « D'après vos centres d'intérêt », « Pour découvrir autre chose »); four round actions (J'aime, Sauvegarder, Partager, Pas intéressé); a full-width « Lire l'article chez [source] » pill; the tab bar.

On a computer the ambiance fills the window and the navigation stays at the bottom, as on a phone. From 1024 px wide, on a landscape screen, the article takes two columns, so a horizontal screen is used in its width: the 16:9 photo on the left, the text on the right (source, a larger title bounded by the window's height, summary, reason, actions, reading pill), the pair centred vertically within 1240 px. An article without an image keeps the single centred column.

**Without an image**, the field is a two-colour gradient of the article's topic (`--topic-<slug>`); the photo slot disappears, the title moves up and grows.

**Light and dark** follow the system. The dark field is darker and saturated; the light field is pale and veiled in white.

## Contrast whatever the image

The field's brightness is capped by `--ambient-filter`, then covered by `--ambient-veil`. Computed for the worst image (all white in dark, all black in light):

| Text | Dark theme | Light theme |
| --- | --- | --- |
| Title and text (`--ambient-ink`) | 8.6:1 | 9.5:1 |
| Secondary text (`--ambient-ink-2`) | 6.4:1 | 7.2:1 |

Main text meets WCAG AAA (7:1) in both themes, secondary text AA everywhere and AAA in light. Never put text directly on the sharp photo.

## Motion

One authored moment: when the active article changes, the new ambiance layer fades in on top of the old one (`--duration-ambient`, 700 ms, `--ease-out-expo`) while the old one stays full underneath, then goes out over a short 250 ms tail, so the light never dips between two articles; the incoming photo settles from 96 % scale and 60 % opacity at the same time. The sign-in panel uses the same handover for the topics' colours taking turns. A chosen topic tile lights up over the same 700 ms, its label switching from ink to white in one step about a tenth of the way in, so it never passes through the ground's own value. Everything else is short state feedback (pressed actions scale to 92 %, the toast enters from 8 px above). With `prefers-reduced-motion`, the light changes at once, the sign-in panel holds its first colour and nothing moves.

## Voice

Plain French, « vous », no exclamation marks in the interface. Controls name their action (« Lire l'article chez franceinfo », « Pas intéressé »).

## Working files

The exploration (rejected directions, compositions, symbol studies), the interactive prototype and the feed's direction contract are working files of the design tooling, kept outside the repository.
