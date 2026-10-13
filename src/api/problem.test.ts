import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage, toApiError } from './problem'

describe('toApiError', () => {
  it('maps a validation ProblemDetail to field errors and a French message', () => {
    const error = toApiError(400, {
      detail: 'Request validation failed',
      status: 400,
      title: 'Bad Request',
      errors: [
        { field: 'email', message: 'doit être une adresse électronique syntaxiquement correcte' },
        { field: 'password', message: 'la taille doit être comprise entre 8 et 72' },
      ],
    })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('Certaines informations sont invalides.')
    expect(error.fieldErrors).toEqual({
      email: 'doit être une adresse électronique syntaxiquement correcte',
      password: 'la taille doit être comprise entre 8 et 72',
    })
  })

  it('never shows the English detail', () => {
    const error = toApiError(503, { status: 503, title: 'Service Unavailable', detail: 'Recommender down' })
    expect(error.message).toBe('Le service est momentanément indisponible. Réessayez plus tard.')
  })

  it('handles a body that is not a ProblemDetail', () => {
    const error = toApiError(404, 'Not Found')
    expect(error.message).toBe('Élément introuvable.')
    expect(error.fieldErrors).toEqual({})
  })
})

describe('getErrorMessage', () => {
  it('falls back to a generic message for unknown errors', () => {
    expect(getErrorMessage(new TypeError('boom'))).toBe('Une erreur inattendue est survenue.')
  })
})
