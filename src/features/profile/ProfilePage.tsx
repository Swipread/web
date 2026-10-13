import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError, getErrorMessage } from '../../api/problem'
import type { Schema } from '../../api/types'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { ErrorState } from '../../ui/ErrorState'
import { LoadingState } from '../../ui/LoadingState'
import { PageHeader } from '../../ui/PageHeader'
import { TextField } from '../../ui/TextField'
import { useToast } from '../../ui/toastContext'
import { useMe } from '../auth/useAuth'
import { selectionLabel } from '../onboarding/selectionLabel'
import { TopicPicker } from '../onboarding/TopicPicker'
import { MIN_TOPICS, useTopics, useUpdateTopics } from '../onboarding/useTopics'
import { useTopicSelection } from '../onboarding/useTopicSelection'
import { profileSchema, type ProfileValues } from './schemas'
import { useDeleteAccount, useUpdateProfile } from './useProfile'
import styles from './ProfilePage.module.css'

export function ProfilePage() {
  const me = useMe()

  return (
    <>
      <PageHeader title="Profil" subtitle="Gérez vos informations et vos centres d'intérêt" />
      {me.isPending ? (
        <LoadingState />
      ) : me.isError ? (
        <ErrorState message={getErrorMessage(me.error)} onRetry={() => void me.refetch()} retrying={me.isRefetching} />
      ) : (
        <div className={styles.sections}>
          <InfoSection me={me.data} />
          <TopicsSection selectedIds={me.data.topics?.flatMap((t) => (t.id === undefined ? [] : [t.id]))} />
          <DeleteAccountSection />
        </div>
      )}
    </>
  )
}

function InfoSection({ me }: { me: Schema<'MeResponse'> }) {
  const updateProfile = useUpdateProfile()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: me.displayName ?? '' },
  })

  const onSubmit = handleSubmit((values) =>
    updateProfile.mutate(values, {
      onSuccess: (updated) => {
        // The server trims the name: show what it saved.
        reset({ displayName: updated.displayName ?? values.displayName })
        toast.show('Nom enregistré')
      },
      onError: (error) => {
        const message = error instanceof ApiError ? error.fieldErrors.displayName : undefined
        if (message) setError('displayName', { message })
      },
    }),
  )

  const formError =
    updateProfile.error instanceof ApiError && updateProfile.error.fieldErrors.displayName
      ? null
      : updateProfile.error && getErrorMessage(updateProfile.error)

  return (
    <section className={styles.section} aria-labelledby="profile-info">
      <h2 id="profile-info" className={styles.sectionTitle}>
        Informations
      </h2>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.fields}>
          <TextField
            label="Nom affiché"
            autoComplete="nickname"
            maxLength={50}
            error={errors.displayName?.message}
            {...register('displayName')}
          />
          <TextField label="Email (non modifiable)" value={me.email ?? ''} readOnly />
        </div>
        {formError && (
          <p role="alert" className={styles.error}>
            {formError}
          </p>
        )}
        <div>
          <Button type="submit" disabled={!isDirty} loading={updateProfile.isPending}>
            Enregistrer
          </Button>
        </div>
      </form>
    </section>
  )
}

function TopicsSection({ selectedIds }: { selectedIds: number[] | undefined }) {
  const topics = useTopics()
  const updateTopics = useUpdateTopics()
  const selection = useTopicSelection(selectedIds)
  const toast = useToast()
  const count = selection.selected.size

  const save = () =>
    updateTopics.mutate([...selection.selected], {
      onSuccess: () => {
        selection.reset()
        toast.show('Centres d’intérêt enregistrés')
      },
    })

  return (
    <section className={styles.section} aria-labelledby="profile-topics">
      <h2 id="profile-topics" className={styles.sectionTitle}>
        Centres d'intérêt
      </h2>
      {topics.isPending ? (
        <LoadingState label="Chargement des thèmes…" />
      ) : topics.isError ? (
        <ErrorState
          message={getErrorMessage(topics.error)}
          onRetry={() => void topics.refetch()}
          retrying={topics.isRefetching}
        />
      ) : (
        <>
          <TopicPicker topics={topics.data} selectedIds={selection.selected} onToggle={selection.toggle} align="start" />
          {count < MIN_TOPICS && (
            <p className={styles.hint} aria-live="polite">
              {selectionLabel(count, MIN_TOPICS)}
            </p>
          )}
          {updateTopics.isError && (
            <p role="alert" className={styles.error}>
              {getErrorMessage(updateTopics.error)}
            </p>
          )}
          <div>
            <Button
              variant="secondary"
              onClick={save}
              disabled={!selection.isDirty || count < MIN_TOPICS}
              loading={updateTopics.isPending}
            >
              Enregistrer mes thèmes
            </Button>
          </div>
        </>
      )}
    </section>
  )
}

function DeleteAccountSection() {
  const [confirming, setConfirming] = useState(false)
  const deleteAccount = useDeleteAccount()

  const close = () => {
    setConfirming(false)
    deleteAccount.reset()
  }

  return (
    <section className={styles.section} aria-labelledby="profile-delete">
      <h2 id="profile-delete" className={styles.sectionTitle}>
        Supprimer mon compte
      </h2>
      <p className={styles.hint}>
        Votre compte, vos thèmes et votre historique seront définitivement effacés. Une confirmation vous sera
        demandée.
      </p>
      <div>
        <Button variant="secondary" onClick={() => setConfirming(true)}>
          Supprimer mon compte
        </Button>
      </div>
      <ConfirmDialog
        open={confirming}
        title="Supprimer votre compte ?"
        confirmLabel="Supprimer définitivement"
        danger
        pending={deleteAccount.isPending}
        error={deleteAccount.isError ? getErrorMessage(deleteAccount.error) : null}
        onConfirm={() => deleteAccount.mutate()}
        onCancel={close}
      >
        <p>
          Votre compte, vos centres d'intérêt, vos articles sauvegardés, vos j'aime et votre historique seront
          effacés. Cette action est irréversible.
        </p>
      </ConfirmDialog>
    </section>
  )
}
