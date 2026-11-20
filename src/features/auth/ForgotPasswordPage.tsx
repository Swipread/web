import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link, useLocation } from 'react-router'
import { ApiError, getErrorMessage } from '../../api/problem'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthLayout } from './AuthLayout'
import { forgotPasswordSchema, type ForgotPasswordValues } from './schemas'
import { useForgotPassword } from './useAuth'
import styles from './AuthForm.module.css'

/** Email typed on the login page, carried in the link's state. */
export type ForgotPasswordState = { email?: string } | null

export function ForgotPasswordPage() {
  const forgot = useForgotPassword()
  const location = useLocation()
  const typed = (location.state as ForgotPasswordState)?.email ?? ''
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: typed },
  })

  const onSubmit = handleSubmit((values) =>
    forgot.mutate(values.email, {
      onError: (error) => {
        const message = error instanceof ApiError ? error.fieldErrors.email : undefined
        if (message) setError('email', { message })
      },
    }),
  )

  if (forgot.isSuccess) {
    return (
      <AuthLayout
        title="Vérifiez vos e-mails"
        // Same words whether the address has an account or not: the API does not tell either.
        subtitle={`Si un compte existe pour ${getValues('email').trim()}, un lien pour choisir un nouveau mot de passe vient d’y être envoyé. Il est valable une heure.`}
      >
        <p className={styles.hint}>Rien reçu après quelques minutes ? Regardez dans les indésirables.</p>
        <p className={styles.switch}>
          <Link to="/connexion">Revenir à la connexion</Link>
        </p>
      </AuthLayout>
    )
  }

  const fieldRejected = forgot.error instanceof ApiError && forgot.error.fieldErrors.email
  const formError = forgot.error && !fieldRejected ? getErrorMessage(forgot.error) : null

  return (
    <AuthLayout
      title="Mot de passe oublié"
      subtitle="Indiquez l’email de votre compte : nous vous enverrons un lien pour choisir un nouveau mot de passe."
    >
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <p role="alert" className={styles.formError}>
            {formError}
          </p>
        )}
        <TextField
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="vous@exemple.fr"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" fullWidth loading={forgot.isPending} className={styles.submit}>
          Recevoir le lien
        </Button>
      </form>
      <p className={styles.switch}>
        <Link to="/connexion">Revenir à la connexion</Link>
      </p>
    </AuthLayout>
  )
}
