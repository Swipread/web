import { useLayoutEffect, useRef, useState } from 'react'
import { ApiError } from '../../api/problem'
import { Button } from '../../ui/Button'
import { useToast } from '../../ui/toastContext'
import { useMe, useResendVerification } from './useAuth'
import styles from './EmailVerificationBanner.module.css'

const DISMISSED_KEY = 'swipread.verifyBanner.dismissed'

function wasDismissed() {
  try {
    return sessionStorage.getItem(DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * Reminds a reader who has not clicked the link sent at sign-up. « Plus tard » hides it until the tab is closed.
 * Its height is published as --notice-height, which full-height pages (the feed) take off their own.
 */
export function EmailVerificationBanner() {
  const me = useMe()
  const resend = useResendVerification()
  const toast = useToast()
  const [dismissed, setDismissed] = useState(wasDismissed)
  const ref = useRef<HTMLDivElement>(null)
  const visible = me.data?.emailVerified === false && !dismissed

  useLayoutEffect(() => {
    const root = document.documentElement
    const element = ref.current
    if (!visible || !element) return
    const publish = () => root.style.setProperty('--notice-height', `${element.offsetHeight}px`)
    publish()
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(publish)
    observer?.observe(element)
    return () => {
      observer?.disconnect()
      root.style.removeProperty('--notice-height')
    }
  }, [visible])

  if (!visible) return null

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISSED_KEY, '1')
    } catch {
      // Private mode: hidden for this page only.
    }
    setDismissed(true)
  }

  const send = () =>
    resend.mutate(undefined, {
      onSuccess: () => toast.show(`Nouveau lien envoyé à ${me.data?.email ?? 'votre adresse'}`),
      onError: (error) => {
        if (error instanceof ApiError && error.status === 409) {
          void me.refetch()
        } else if (error instanceof ApiError && error.status === 429) {
          toast.show('Un lien vient d’être envoyé. Réessayez dans une minute.')
        } else {
          toast.show('Le lien n’a pas pu être envoyé. Réessayez plus tard.')
        }
      },
    })

  return (
    <div ref={ref} className={styles.wrapper}>
      <div className={styles.banner} role="region" aria-label="Confirmation de l'adresse e-mail">
        <p className={styles.text}>
          Confirmez votre adresse : un lien a été envoyé à <strong>{me.data?.email}</strong>.
        </p>
        <div className={styles.actions}>
          <Button variant="secondary" onClick={send} loading={resend.isPending}>
            Renvoyer le lien
          </Button>
          <Button variant="ghost" onClick={dismiss}>
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  )
}
