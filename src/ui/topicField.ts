import styles from './topicField.module.css'

const SLUGS = ['environment', 'science', 'culture', 'politics', 'economy', 'tech', 'sport', 'health'] as const

/** Class painting the topic's gradient; topics without their own colours get the neutral one. */
export function topicFieldClass(slug: string | undefined) {
  return (SLUGS as readonly (string | undefined)[]).includes(slug) ? styles[slug as string] : styles.default
}
