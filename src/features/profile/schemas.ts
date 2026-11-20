import { z } from 'zod'
import { displayNameSchema, newPasswordSchema } from '../auth/schemas'

export const profileSchema = z.object({ displayName: displayNameSchema })

export type ProfileValues = z.infer<typeof profileSchema>

// Limits mirror ChangePasswordRequest in the OpenAPI spec; the confirmation stays in the browser.
export const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Saisissez votre mot de passe actuel.'),
    newPassword: newPasswordSchema,
    confirmation: z.string().min(1, 'Confirmez le nouveau mot de passe.'),
  })
  .refine((values) => values.confirmation === values.newPassword, {
    path: ['confirmation'],
    message: 'Les deux mots de passe ne correspondent pas.',
  })

export type PasswordValues = z.infer<typeof passwordSchema>
