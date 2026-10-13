import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './toastContext'
import styles from './Toast.module.css'

const TOAST_DURATION_MS = 4_000

type Toast = { id: number; message: string }

/** Short confirmations ("Lien copié"), announced politely to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const nextId = useRef(0)

  const show = useCallback((message: string) => {
    nextId.current += 1
    setToast({ id: nextId.current, message })
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), TOAST_DURATION_MS)
    return () => clearTimeout(timer)
  }, [toast])

  const api = useMemo(() => ({ show }), [show])

  return (
    <ToastContext value={api}>
      {children}
      <div className={styles.region} role="status" aria-live="polite" aria-label="Notifications">
        {toast && (
          <p key={toast.id} className={styles.toast}>
            {toast.message}
          </p>
        )}
      </div>
    </ToastContext>
  )
}
