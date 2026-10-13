import type { components } from './schema'

/** Shorthand for generated schemas, e.g. `Schema<'FeedItem'>`. */
export type Schema<Name extends keyof components['schemas']> = components['schemas'][Name]
