import { z } from 'zod'

// Limits mirror RegisterRequest / LoginRequest in the OpenAPI spec.
export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Saisissez votre email.').pipe(z.email('Saisissez un email valide.')),
  password: z.string().min(1, 'Saisissez votre mot de passe.'),
})

/** Also used to edit the profile (UpdateMeRequest). */
export const displayNameSchema = z
  .string()
  .trim()
  .min(1, 'Saisissez le nom à afficher.')
  .max(50, 'Le nom ne doit pas dépasser 50 caractères.')

/** A password being chosen, at sign-up or to replace the current one. */
export const newPasswordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères.')
  .max(72, 'Le mot de passe ne doit pas dépasser 72 caractères.')

export const registerSchema = z.object({
  displayName: displayNameSchema,
  email: z
    .string()
    .trim()
    .min(1, 'Saisissez votre email.')
    .max(254, "L'email est trop long.")
    .pipe(z.email('Saisissez un email valide.')),
  password: newPasswordSchema,
})

/** Limits mirror ForgotPasswordRequest. */
export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Saisissez votre email.')
    .max(254, "L'email est trop long.")
    .pipe(z.email('Saisissez un email valide.')),
})

/** Limits mirror ResetPasswordRequest; the confirmation stays in the browser. */
export const resetPasswordSchema = z
  .object({
    newPassword: newPasswordSchema,
    confirmation: z.string().min(1, 'Confirmez le nouveau mot de passe.'),
  })
  .refine((values) => values.confirmation === values.newPassword, {
    path: ['confirmation'],
    message: 'Les deux mots de passe ne correspondent pas.',
  })

export type LoginValues = z.infer<typeof loginSchema>
export type RegisterValues = z.infer<typeof registerSchema>
export type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>
