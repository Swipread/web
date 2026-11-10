# User-facing messages

Every message the reader can see comes from the frontend, in French. The API's `detail` (in English) is never shown as is, except as the end of an untranslated feed-check message. Keep this page in sync when you add or change a message.

## By HTTP status (`src/api/problem.ts`)

`getErrorMessage(error)` returns `ApiError.message`, chosen from the status:

| Status | Message |
| --- | --- |
| `0` (unreachable) | Impossible de joindre le serveur. Vérifiez votre connexion. |
| 400, 422 | Certaines informations sont invalides. |
| 401 | Votre session a expiré. Reconnectez-vous. |
| 403 | Vous n'avez pas accès à cette page. |
| 404 | Élément introuvable. |
| 409 | Cette action entre en conflit avec des données existantes. |
| 429 | Trop de tentatives. Réessayez dans quelques instants. |
| ≥ 500 | Le service est momentanément indisponible. Réessayez plus tard. |
| other / not an `ApiError` | Une erreur inattendue est survenue. |

## Server field errors (`fieldMessage`)

For a 400 with `errors[]`, each field gets a message from its constraint `code`:

| Code | Message |
| --- | --- |
| `NotBlank`, `NotNull`, `NotEmpty` | Ce champ est obligatoire. |
| `Size` | La longueur de ce champ n'est pas acceptée. |
| `Email` | Saisissez un email valide. |
| `Pattern` | Le format de ce champ n'est pas valide. |
| anything else | Cette valeur n'est pas acceptée. |

Client-side validation usually catches these first; the mapping is the safety net.

## Screen-specific errors

| Where | Situation | Message |
| --- | --- | --- |
| Login | 401 | Email ou mot de passe incorrect. |
| Sign-up | 409 | Cet email est déjà utilisé. (on the email field) |
| Admin, sources | 409 on create | Une source utilise déjà ce flux. |
| Admin, sources | 422 on create | See the feed-check table in [Administration](../features/admin.md#sources-adminsources) |
| Admin, sources | 409 on delete | Dialog « Cette source a déjà des articles », with « Désactiver la source » |
| Admin, topics | 409 on create or rename | Ce thème existe déjà (accents et majuscules ne comptent pas). |
| Admin, topics | 400 on the label | Le nom doit contenir au moins une lettre ou un chiffre. |
| Admin, topics | 404 on rename | Ce thème n'existe plus. Rechargez la page. |
| Share | Nothing worked | Impossible de partager ce lien. (toast) |

## Form validation (Zod schemas)

| Form | Field | Messages |
| --- | --- | --- |
| Login | Email | Saisissez votre email. · Saisissez un email valide. |
| Login | Password | Saisissez votre mot de passe. |
| Sign-up, profile | Display name | Saisissez le nom à afficher. · Le nom ne doit pas dépasser 50 caractères. |
| Sign-up | Email | Saisissez votre email. · L'email est trop long. · Saisissez un email valide. |
| Sign-up | Password | Le mot de passe doit contenir au moins 8 caractères. · Le mot de passe ne doit pas dépasser 72 caractères. |
| Source | Name | Saisissez le nom de la source. · Le nom ne doit pas dépasser 100 caractères. |
| Source | Site URL, feed URL | Saisissez l'adresse du site / du flux. · L'adresse ne doit pas dépasser 2 048 caractères. · Saisissez une adresse commençant par http:// ou https://. |
| Source | Language | Saisissez un code à deux lettres, par exemple fr. |
| Source | Licence | La licence ne doit pas dépasser 200 caractères. |
| Topic | Label | Saisissez le nom du thème. · Le nom ne doit pas dépasser 50 caractères. · Le nom doit contenir au moins une lettre ou un chiffre. |

## Confirmations (toasts)

| Action | Message |
| --- | --- |
| Link copied | Lien copié |
| Display name saved | Nom enregistré |
| Topics saved | Centres d'intérêt enregistrés |
| Article removed from saved | Article retiré des sauvegardés |
| Account deleted | Votre compte a été supprimé |
| Source added | Source « <name> » ajoutée |
| Source activated / deactivated | Source activée · Source désactivée |
| Source deleted | Source supprimée |
| Topic created | Thème « <label> » créé |
| Topic renamed | Thème renommé en « <label> » |

## Empty states

| Screen | Title |
| --- | --- |
| Feed, nothing at all | Votre fil est vide pour le moment |
| Feed, end reached | Vous êtes à jour |
| Saved | Aucun article sauvegardé |
| History | Aucun article lu pour le moment |
| Onboarding | Aucun thème disponible |
| Admin sources | Aucune source |
| Admin topics | Aucun thème |
