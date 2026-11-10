import { describe, expect, it } from 'vitest'
import { ApiError, getErrorMessage, toApiError } from './problem'

describe('toApiError', () => {
  it('maps a validation ProblemDetail to field errors and a French message', () => {
    const error = toApiError(400, {
      detail: 'Request validation failed',
      status: 400,
      title: 'Bad Request',
      errors: [
        { field: 'email', code: 'Email', message: 'must be a well-formed email address' },
        { field: 'password', code: 'Size', message: 'size must be between 8 and 72' },
        { field: 'password', code: 'NotBlank', message: 'must not be blank' },
        { field: 'locale', code: 'Weird', message: 'is weird' },
        { field: 'displayName', message: 'must not be blank' },
      ],
    })

    expect(error).toBeInstanceOf(ApiError)
    expect(error.status).toBe(400)
    expect(error.message).toBe('Certaines informations sont invalides.')
    // Never the server's English message: a French one from the constraint code, the first one per field.
    expect(error.fieldErrors).toEqual({
      email: 'Saisissez un email valide.',
      password: "La longueur de ce champ n'est pas acceptée.",
      locale: "Cette valeur n'est pas acceptée.",
      displayName: "Cette valeur n'est pas acceptée.",
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
