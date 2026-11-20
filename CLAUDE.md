# Swipread web

Frontend web de Swipread : fil d'articles recommandés à faire défiler, une carte par écran.
Ordinateur d'abord, responsive. React 19 + TypeScript + Vite.

## Sources de vérité

- Périmètre : `notes/user-stories-taches.md` (tâches [FRONT] uniquement)
- Événements : `notes/Contrat backend reco.md`
- API : spec OpenAPI `http://localhost:8080/v3/api-docs`, types dans `src/api/schema.d.ts`
- Maquettes : Figma `phZjKVJEUmWYWwWByMHaYa` (wireframes : respecter structure et hiérarchie, pas les gris)

## Commandes

- `npm run dev` · `npm test` · `npm run lint` · `npm run build`
- `npm run gen:api` : régénère `src/api/schema.d.ts` (variable `OPENAPI_URL` pour changer d'URL)

## Conventions

- Textes de l'interface en français, code (noms, commentaires) en anglais
- Routes en français : `/connexion`, `/inscription`, `/verifier-email`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/centres-interet`, `/`, `/sauvegardes`, `/historique`, `/profil`, `/admin/sources`, `/admin/themes`
- Organisation par fonctionnalité dans `src/features/<feature>/` (auth, onboarding, feed, tracking, share, saved, history, profile, admin) ; composants partagés dans `src/ui/`
- Jamais de DTO écrits à la main : utiliser les types de `src/api/schema.d.ts`, jamais modifier ce fichier
- Appels API uniquement via le client `src/api/client.ts` (openapi-fetch) enveloppé dans des hooks TanStack Query
- Formulaires : React Hook Form + schéma Zod dans `schemas.ts` de la fonctionnalité
- Style : CSS Modules (`Component.module.css`) ; couleurs, espacements, rayons et durées uniquement via les variables de `src/ui/tokens.css`. Direction artistique « Ambiance » (`docs/design.md`, cible de la refonte) : identité en encre seule (noir/blanc, aucune couleur de marque), la couleur vient de l'image de l'article (fond flouté et voilé, contrastes garantis par les variables `--ambient-*`) ; police Schibsted Grotesk auto-hébergée ; symbole « guillemets qui montent » ; swipe vertical plein écran, un article par écran (imposé) ; jamais de déguisement d'objet ni de rétro ; titres et résumés des éditeurs jamais réécrits ; animations désactivées avec `prefers-reduced-motion`. Clair/sombre via `prefers-color-scheme`. Contexte produit et contrat de direction (skill Impeccable) : `notes/impeccable/`, reliés par les liens ignorés `PRODUCT.md` et `.impeccable/surfaces`
- Chaque écran gère chargement, erreur (avec « Réessayer ») et liste vide
- Accessibilité : `aria-label` sur tout bouton icône, `aria-pressed` sur les bascules, focus visible, contrastes AA, fil navigable aux flèches ↑/↓
- Événements : toujours via `tracker` (`src/features/tracking/tracker.ts`), jamais d'appel direct à `/v1/events` ; `eventId` généré côté client ; envoi final avec `fetch` `keepalive` (pas `sendBeacon`, qui ne transmet pas le JWT)
- Tests : Vitest + Testing Library, fichier `*.test.tsx` à côté du composant, API mockée avec msw (`src/test/handlers.ts`)

## Demandes au backend

Si un endpoint nécessaire est absent de la spec, ne correspond pas aux user stories, ou si le backend doit changer (CORS, DTO, statut…) : le consigner dans `notes/demandes-backend.md` (transmis à l'équipe backend) et le signaler, sans le contourner (pas de fausse API, pas de décodage du JWT pour en tirer des infos).

## Git

- Commits petits et fréquents, au format Conventional Commits (`feat(feed): …`, `fix(auth): …`, `chore: …`, `test: …`, `docs: …`), scope = nom de la fonctionnalité
- Pas de ligne `Co-Authored-By` dans les commits
- Le dossier `notes/` (documents internes) n'est jamais commité (ignoré par git) ; `docs/` est la documentation développeur publiée, en anglais
