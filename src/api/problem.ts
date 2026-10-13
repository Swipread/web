import type { Schema } from './types'

/** RFC 9457 problem details, as returned by the backend (`application/problem+json`). */
export type ProblemDetail = Schema<'ProblemDetail'>

export type FieldErrors = Record<string, string>

/** Status 0 means the server could not be reached. */
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: FieldErrors
  readonly problem?: ProblemDetail

  constructor(status: number, message: string, fieldErrors: FieldErrors = {}, problem?: ProblemDetail) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
    this.problem = problem
  }
}

const NETWORK_MESSAGE = 'Impossible de joindre le serveur. Vérifiez votre connexion.'

// The backend's `detail` is in English, so the UI relies on these messages instead.
export function messageForStatus(status: number): string {
  if (status === 0) return NETWORK_MESSAGE
  if (status >= 500) return 'Le service est momentanément indisponible. Réessayez plus tard.'
  switch (status) {
    case 400:
    case 422:
      return 'Certaines informations sont invalides.'
    case 401:
      return 'Votre session a expiré. Reconnectez-vous.'
    case 403:
      return "Vous n'avez pas accès à cette page."
    case 404:
      return 'Élément introuvable.'
    case 409:
      return 'Cette action entre en conflit avec des données existantes.'
    case 429:
      return 'Trop de tentatives. Réessayez dans quelques instants.'
    default:
      return 'Une erreur inattendue est survenue.'
  }
}

function isProblemDetail(body: unknown): body is ProblemDetail {
  return typeof body === 'object' && body !== null && ('status' in body || 'title' in body)
}

export function toApiError(status: number, body: unknown): ApiError {
  const problem = isProblemDetail(body) ? body : undefined
  const fieldErrors: FieldErrors = {}
  for (const { field, message } of problem?.errors ?? []) {
    // Keep the first message per field.
    if (field && message) fieldErrors[field] ??= message
  }
  return new ApiError(status, messageForStatus(status), fieldErrors, problem)
}

export function networkError(): ApiError {
  return new ApiError(0, NETWORK_MESSAGE)
}

/** User-facing message for anything thrown by a query or mutation. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message
  return messageForStatus(-1)
}
