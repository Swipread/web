# Contributing

## Before opening a pull request

```bash
npm test && npm run lint && npm run build
```

All three must pass. `npm run build` also runs the TypeScript compiler.

## Conventions

- **Language.** User-facing text is in French; code, identifiers, comments, tests and documentation are in English.
- **Routes** are in French: `/connexion`, `/inscription`, `/centres-interet`, `/`, `/sauvegardes`, `/historique`, `/profil`, `/admin/sources`, `/admin/themes`.
- **Structure.** New code goes into the feature it belongs to (`src/features/<feature>/`); a component used by several features moves to `src/ui/`.
- **API.** Never write a DTO by hand: use the generated types (`Schema<'Name'>`). Call the API only through the `api` client, wrapped in a TanStack Query hook. If an endpoint is missing or wrong, ask for an API change rather than working around it (no fake endpoint, no decoding of the JWT).
- **Events.** Always record them through `tracker`; never call `/v1/events` directly.
- **Forms.** React Hook Form with a Zod schema in the feature's `schemas.ts`. Limits mirror the API's validation rules.
- **Styles.** One CSS Module per component, and only the variables from `src/ui/tokens.css` for colours, spacing, radii and durations. Check both themes and a 375 px wide viewport.
- **States.** Every screen handles loading, errors (with « Réessayer ») and empty lists.

## Accessibility checklist

- Icon-only buttons have an `aria-label`; toggles (like, save) use `aria-pressed`.
- Every interactive element is reachable and usable with the keyboard, with a visible focus.
- Text contrast meets WCAG AA in light and dark themes.
- Animations are disabled with `prefers-reduced-motion`.
- Dialogs use `ConfirmDialog` (native `<dialog>`, focus on the cancel button).

## Adding a feature

1. Create `src/features/<feature>/` with its hooks, components and page.
2. If it needs new endpoints, regenerate the types (`npm run gen:api`).
3. Add the route in `src/app/routes.tsx` (and a sidebar entry if needed).
4. Add default msw handlers and fixtures for its endpoints, then its tests.
5. Update this documentation when the change affects architecture, the API integration or the setup.

## Commits

[Conventional Commits](https://www.conventionalcommits.org/), small and focused, with the feature as scope:

```
feat(feed): add share action to feed cards
fix(api): show French messages for server field errors
docs: describe the token refresh flow
```

Types in use: `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `chore`.
