# Swipread web

Frontend web de Swipread : fil d'articles recommandés à faire défiler, une carte par écran.
Ordinateur d'abord, responsive. React 19 + TypeScript + Vite.

## Sources de vérité

- Périmètre : `docs/user-stories-taches.md` (tâches [FRONT] uniquement)
- Événements : `docs/Contrat backend reco.md`
- API : spec OpenAPI `http://localhost:8080/v3/api-docs`, types dans `src/api/schema.d.ts`
- Maquettes : Figma `phZjKVJEUmWYWwWByMHaYa` (wireframes : respecter structure et hiérarchie, pas les gris)

## Commandes

- `npm run dev` · `npm test` · `npm run lint` · `npm run build`
- `npm run gen:api` : régénère `src/api/schema.d.ts` (variable `OPENAPI_URL` pour changer d'URL)

## Conventions

- Textes de l'interface en français, code (noms, commentaires) en anglais
- Routes en français : `/connexion`, `/inscription`, `/centres-interet`, `/`, `/sauvegardes`, `/historique`, `/profil`, `/admin/sources`, `/admin/themes`
- Organisation par fonctionnalité dans `src/features/<feature>/` (auth, onboarding, feed, tracking, share, saved, history, profile, admin) ; composants partagés dans `src/ui/`
- Jamais de DTO écrits à la main : utiliser les types de `src/api/schema.d.ts`, jamais modifier ce fichier
- Appels API uniquement via le client `src/api/client.ts` (openapi-fetch) enveloppé dans des hooks TanStack Query
- Formulaires : React Hook Form + schéma Zod dans `schemas.ts` de la fonctionnalité
- Style : CSS Modules (`Component.module.css`) ; couleurs, espacements, rayons et durées uniquement via les variables de `src/ui/tokens.css`. Sobre, inspiré d'Apple : espace, typographie système, peu de couleurs, animations discrètes et désactivées avec `prefers-reduced-motion`. Clair/sombre via `prefers-color-scheme`
- Chaque écran gère chargement, erreur (avec « Réessayer ») et liste vide
- Accessibilité : `aria-label` sur tout bouton icône, `aria-pressed` sur les bascules, focus visible, contrastes AA, fil navigable aux flèches ↑/↓
- Événements : toujours via `useTrack` / `eventQueue`, jamais d'appel direct à `/v1/events` ; `eventId` généré côté client ; envoi final avec `fetch` `keepalive` (pas `sendBeacon`, qui ne transmet pas le JWT)
- Tests : Vitest + Testing Library, fichier `*.test.tsx` à côté du composant, API mockée avec msw (`src/test/handlers.ts`)

## Demandes au backend

Si un endpoint nécessaire est absent de la spec, ne correspond pas aux user stories, ou si le backend doit changer (CORS, DTO, statut…) : le consigner dans `docs/demandes-backend.md` (transmis à l'équipe backend) et le signaler, sans le contourner (pas de fausse API, pas de décodage du JWT pour en tirer des infos).

## Git

- Commits petits et fréquents, au format Conventional Commits (`feat(feed): …`, `fix(auth): …`, `chore: …`, `test: …`, `docs: …`), scope = nom de la fonctionnalité
- Pas de ligne `Co-Authored-By` dans les commits
- Le dossier `docs/` n'est jamais commité (ignoré par git)
