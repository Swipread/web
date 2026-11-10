# Swipread web documentation

Developer documentation for the web frontend. Start with [Getting started](getting-started.md), then [Architecture](architecture.md).

## Guides

| Page | Read it to… |
| --- | --- |
| [Getting started](getting-started.md) | Install, configure and run the app against a local API |
| [Architecture](architecture.md) | Understand the code organisation, routing, data fetching, the feed and the design system |
| [Backend integration](backend-integration.md) | Work with the generated types, the API client, errors, authentication and events |
| [Flows](flows.md) | Follow the main sequences step by step (sign-up, paging, events, token renewal, admin) |
| [Testing](testing.md) | Write and run tests with Vitest, Testing Library and msw |
| [Contributing](contributing.md) | Follow the conventions, the accessibility checklist and the commit format |
| [Deployment](deployment.md) | Build and serve the app in production (Docker and Nginx example, CI, checklist) |
| [Decision records](decisions.md) | Know why things are the way they are |
| [FAQ and troubleshooting](faq.md) | Fix common problems |
| [Glossary](glossary.md) | Look up a term |

## Features

| Feature | Screens |
| --- | --- |
| [Authentication](features/auth.md) | `/connexion`, `/inscription`, session and logout |
| [Onboarding](features/onboarding.md) | `/centres-interet` |
| [Feed](features/feed.md) | `/` (« Pour vous ») |
| [Tracking](features/tracking.md) | Events sent from every screen |
| [Sharing](features/sharing.md) | Share sheet and clipboard |
| [Saved articles](features/saved.md) | `/sauvegardes` |
| [Reading history](features/history.md) | `/historique` |
| [Profile](features/profile.md) | `/profil` |
| [Administration](features/admin.md) | `/admin/sources`, `/admin/themes` |

## Reference

| Page | Content |
| --- | --- |
| [UI components](reference/ui-components.md) | Props and usage of every shared component |
| [Hooks and cache](reference/hooks-and-cache.md) | Query keys, which action updates which cache, client-side storage |
| [Design tokens](reference/design-tokens.md) | Colours (light and dark), typography, spacing, layout, motion, breakpoints |
| [Messages](reference/messages.md) | Every user-facing error, validation, toast and empty-state text |
| [Endpoints](reference/endpoints.md) | Every API endpoint the app calls, and from where |
