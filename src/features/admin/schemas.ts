import { z } from 'zod'

// Limits mirror CreateSourceRequest and TopicLabelRequest (docs/api.md, Administration).

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value)
    return protocol === 'http:' || protocol === 'https:'
  } catch {
    return false
  }
}

const urlSchema = (emptyMessage: string) =>
  z
    .string()
    .trim()
    .min(1, emptyMessage)
    .max(2048, "L'adresse ne doit pas dépasser 2 048 caractères.")
    .refine(isHttpUrl, 'Saisissez une adresse commençant par http:// ou https://.')

export const sourceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Saisissez le nom de la source.')
    .max(100, 'Le nom ne doit pas dépasser 100 caractères.'),
  siteUrl: urlSchema("Saisissez l'adresse du site."),
  feedUrl: urlSchema("Saisissez l'adresse du flux."),
  // ISO 639-1 code, sent in lowercase.
  language: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z]{2}$/, 'Saisissez un code à deux lettres, par exemple fr.'),
  license: z.string().trim().max(200, 'La licence ne doit pas dépasser 200 caractères.'),
})

export type SourceValues = z.infer<typeof sourceSchema>

export const topicLabelSchema = z
  .string()
  .trim()
  .min(1, 'Saisissez le nom du thème.')
  .max(50, 'Le nom ne doit pas dépasser 50 caractères.')
  .regex(/[\p{L}\p{N}]/u, 'Le nom doit contenir au moins une lettre ou un chiffre.')

export const topicSchema = z.object({ label: topicLabelSchema })

export type TopicValues = z.infer<typeof topicSchema>
