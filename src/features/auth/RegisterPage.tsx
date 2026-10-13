import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router'
import { ApiError, getErrorMessage } from '../../api/problem'
import { Button } from '../../ui/Button'
import { TextField } from '../../ui/TextField'
import { AuthLayout } from './AuthLayout'
import { registerSchema, type RegisterValues } from './schemas'
import { useRegister } from './useAuth'
import styles from './AuthForm.module.css'

const FIELDS = ['displayName', 'email', 'password'] as const

function isField(name: string): name is (typeof FIELDS)[number] {
  return (FIELDS as readonly string[]).includes(name)
}

export function RegisterPage() {
  const registerUser = useRegister()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) })

  // On success the session is saved: guards then route the new reader to onboarding.
  const onSubmit = handleSubmit((values) =>
    registerUser.mutate(values, {
      onError: (error) => {
        if (!(error instanceof ApiError)) return
        if (error.status === 409) {
          setError('email', { message: 'Cet email est déjà utilisé.' }, { shouldFocus: true })
          return
        }
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (isField(field)) setError(field, { message })
        }
      },
    }),
  )

  const error = registerUser.error
  const handledOnFields =
    error instanceof ApiError &&
    (error.status === 409 || Object.keys(error.fieldErrors).some(isField))
  const formError = error && !handledOnFields ? getErrorMessage(error) : null

  return (
    <AuthLayout title="Créer un compte" subtitle="Quelques secondes suffisent pour commencer.">
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        {formError && (
          <p role="alert" className={styles.formError}>
            {formError}
          </p>
        )}
        <TextField
          label="Nom affiché"
          autoComplete="nickname"
          placeholder="Comment souhaitez-vous apparaître ?"
          error={errors.displayName?.message}
          {...register('displayName')}
        />
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
          autoComplete="new-password"
          placeholder="8 caractères minimum"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" fullWidth loading={registerUser.isPending} className={styles.submit}>
          Créer mon compte
        </Button>
      </form>
      <p className={styles.switch}>
        Déjà inscrit ? <Link to="/connexion">Se connecter</Link>
      </p>
    </AuthLayout>
  )
}
