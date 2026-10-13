import { z } from 'zod'
import { displayNameSchema } from '../auth/schemas'

export const profileSchema = z.object({ displayName: displayNameSchema })

export type ProfileValues = z.infer<typeof profileSchema>
