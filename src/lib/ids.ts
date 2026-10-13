/** Prefixed random id, following the contract's convention (`e_…`, `s_…`). */
export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`
}

const SESSION_KEY = 'swipread.sessionId'
let memorySessionId: string | null = null

/** App session id, one per browser tab, sent to the recommender and with every event batch. */
export function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      id = newId('s')
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    memorySessionId ??= newId('s')
    return memorySessionId
  }
}
