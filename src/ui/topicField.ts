import styles from './topicField.module.css'

const SLUGS = ['environment', 'science', 'culture', 'politics', 'economy', 'tech', 'sport', 'health'] as const

/** Whether the topic has colours of its own (others get the neutral gradient). */
export function hasTopicColours(slug: string | undefined) {
  return (SLUGS as readonly (string | undefined)[]).includes(slug)
}

/** Class painting the topic's gradient; topics without their own colours get the neutral one. */
export function topicFieldClass(slug: string | undefined) {
  return hasTopicColours(slug) ? styles[slug as string] : styles.default
}
