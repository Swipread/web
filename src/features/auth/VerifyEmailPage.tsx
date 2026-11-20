import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'
import { ApiError, getErrorMessage } from '../../api/problem'
import { Button } from '../../ui/Button'
import { useToast } from '../../ui/toastContext'
import { AuthLayout } from './AuthLayout'
import { useResendVerification, useSession, useVerifyEmail } from './useAuth'
import styles from './AuthForm.module.css'

/**
 * Target of the link sent by mail (/verifier-email?token=…). Public: the link may be opened on another device.
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const verify = useVerifyEmail()
  const started = useRef(false)

  useEffect(() => {
    // A token works once: never send it twice (StrictMode runs effects twice in development).
    if (!token || started.current) return
    started.current = true
    verify.mutate(token)
  }, [token, verify])

  if (verify.isSuccess) {
    return (
      <AuthLayout title="Adresse confirmée" subtitle="Merci, votre adresse e-mail est confirmée.">
        <ContinueLink />
      </AuthLayout>
    )
  }

  const invalid = !token || (verify.error instanceof ApiError && verify.error.status === 400)
  if (invalid) {
    return (
      <AuthLayout
        title="Ce lien n’est plus valable"
        subtitle="Il a peut-être déjà servi, expiré après 24 heures, ou été remplacé par un lien plus récent."
      >
        <InvalidLinkActions />
      </AuthLayout>
    )
  }

  if (verify.isError) {
    return (
      <AuthLayout title="Confirmation impossible" subtitle={getErrorMessage(verify.error)}>
        <Button onClick={() => token && verify.mutate(token)} loading={verify.isPending}>
          Réessayer
        </Button>
      </AuthLayout>
    )
  }

  return <AuthLayout title="Confirmation de votre adresse…" subtitle="Un instant.">{null}</AuthLayout>
}

function ContinueLink() {
  const signedIn = useSession() !== null
  return (
    <p className={styles.switch}>
      <Link to={signedIn ? '/' : '/connexion'}>{signedIn ? 'Continuer vers Swipread' : 'Se connecter'}</Link>
    </p>
  )
}

function InvalidLinkActions() {
  const signedIn = useSession() !== null
  const resend = useResendVerification()
  const toast = useToast()
  if (!signedIn) {
    return (
      <p className={styles.switch}>
        Connectez-vous pour recevoir un nouveau lien : <Link to="/connexion">Se connecter</Link>
      </p>
    )
  }
  return (
    <div className={styles.form}>
      <Button
        onClick={() =>
          resend.mutate(undefined, {
            onSuccess: () => toast.show('Nouveau lien envoyé'),
            onError: (error) => toast.show(getErrorMessage(error)),
          })
        }
        loading={resend.isPending}
        disabled={resend.isSuccess}
      >
        {resend.isSuccess ? 'Lien envoyé' : 'Recevoir un nouveau lien'}
      </Button>
      <p className={styles.switch}>
        <Link to="/">Revenir à Swipread</Link>
      </p>
    </div>
  )
}
