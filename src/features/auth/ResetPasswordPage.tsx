import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ApiError, getErrorMessage } from '../../api/problem'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthLayout } from './AuthLayout'
import { resetPasswordSchema, type ResetPasswordValues } from './schemas'
import { useResetPassword } from './useAuth'
import styles from './AuthForm.module.css'

/** Tells the login page to say the password was changed. */
export type LoginNoticeState = { passwordReset?: boolean } | null

/**
 * Target of the link sent by mail (/reinitialiser-mot-de-passe?token=…). Public: the link may be opened on another
 * device. The token is only sent with the new password, so opening the link uses nothing.
 */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const resetPassword = useResetPassword()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { newPassword: '', confirmation: '' },
  })

  const onSubmit = handleSubmit((values) => {
    if (!token) return
    resetPassword.mutate(
      { token, newPassword: values.newPassword },
      {
        onSuccess: () => {
          const state: LoginNoticeState = { passwordReset: true }
          void navigate('/connexion', { replace: true, state })
        },
        onError: (error) => {
          const message = error instanceof ApiError ? error.fieldErrors.newPassword : undefined
          if (message) setError('newPassword', { message })
        },
      },
    )
  })

  const error = resetPassword.error
  // A 400 without field errors is the API's « Invalid or expired link ».
  const invalidLink =
    !token || (error instanceof ApiError && error.status === 400 && Object.keys(error.fieldErrors).length === 0)
  if (invalidLink) {
    return (
      <AuthLayout
        title="Ce lien n’est plus valable"
        subtitle="Il a peut-être déjà servi, expiré après une heure, ou été remplacé par un lien plus récent."
      >
        <p className={styles.switch}>
          <Link to="/mot-de-passe-oublie">Recevoir un nouveau lien</Link>
        </p>
      </AuthLayout>
    )
  }

  const fieldRejected = error instanceof ApiError && Object.keys(error.fieldErrors).length > 0
  const formError = error && !fieldRejected ? getErrorMessage(error) : null

  return (
    <AuthLayout
      title="Nouveau mot de passe"
      subtitle="Choisissez-le, puis connectez-vous avec. Tous vos appareils seront déconnectés."
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <p role="alert" className={styles.formError}>
            {formError}
          </p>
        )}
        <TextField
          label="Nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          hint="8 caractères au moins"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <TextField
          label="Confirmer le nouveau mot de passe"
          type="password"
          autoComplete="new-password"
          error={errors.confirmation?.message}
          {...register('confirmation')}
        />
        <Button type="submit" fullWidth loading={resetPassword.isPending} className={styles.submit}>
          Enregistrer le mot de passe
        </Button>
      </form>
    </AuthLayout>
  )
}
