import { zodResolver } from '@hookform/resolvers/zod'
import { useForm, useWatch } from 'react-hook-form'
import { Link, useLocation, useSearchParams } from 'react-router'
import { ApiError, getErrorMessage } from '../../api/problem'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthLayout } from './AuthLayout'
import type { ForgotPasswordState } from './ForgotPasswordPage'
import type { LoginNoticeState } from './ResetPasswordPage'
import { loginSchema, type LoginValues } from './schemas'
import { useLogin } from './useAuth'
import styles from './AuthForm.module.css'

// Generic on purpose: never tell which of email or password is wrong (US2).
const INVALID_CREDENTIALS = 'Email ou mot de passe incorrect.'

export function LoginPage() {
  const login = useLogin()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const passwordReset = (location.state as LoginNoticeState)?.passwordReset === true
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const typedEmail = useWatch({ control, name: 'email' })

  // Navigation happens in RedirectIfAuthenticated once the session is saved.
  const onSubmit = handleSubmit((values) => login.mutate(values))

  const formError =
    login.error instanceof ApiError && login.error.status === 401
      ? INVALID_CREDENTIALS
      : login.error && getErrorMessage(login.error)

  const signUpLink = searchParams.toString() ? `/inscription?${searchParams}` : '/inscription'

  return (
    <AuthLayout title="Se connecter" subtitle="Retrouvez votre fil personnalisé.">
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {passwordReset && !formError && (
          <p role="status" className={styles.notice}>
            Mot de passe modifié. Connectez-vous avec le nouveau.
          </p>
        )}
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
        <TextField
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Link
          to="/mot-de-passe-oublie"
          state={{ email: typedEmail?.trim() } satisfies ForgotPasswordState}
          className={styles.forgot}
        >
          Mot de passe oublié ?
        </Link>
        <Button type="submit" fullWidth loading={login.isPending} className={styles.submit}>
          Se connecter
        </Button>
      </form>
      <p className={styles.switch}>
        Pas encore de compte ? <Link to={signUpLink}>Créer un compte</Link>
      </p>
    </AuthLayout>
  )
}
