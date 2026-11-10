import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useForm, type UseFormSetError } from 'react-hook-form'
import { ApiError, getErrorMessage } from '../../api/problem'
import type { Schema } from '../../api/types'
import { formatCount } from '../../lib/format'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { LoadingState } from '../../ui/LoadingState'
import { PageHeader } from '../../ui/PageHeader'
import { TextField } from '../../ui/TextField'
import { useToast } from '../../ui/toastContext'
import { topicSchema, type TopicValues } from './schemas'
import { useAdminTopics, useCreateTopic, useRenameTopic } from './useAdminTopics'
import table from './AdminTable.module.css'
import styles from './AdminTopicsPage.module.css'

type AdminTopic = Schema<'AdminTopicResponse'> & { id: number }

const hasId = (topic: Schema<'AdminTopicResponse'>): topic is AdminTopic => topic.id !== undefined

/** Maps a failed create/rename to the label field; returns false when it is not about the label. */
function setLabelError(error: unknown, setError: UseFormSetError<TopicValues>) {
  if (!(error instanceof ApiError)) return false
  if (error.status === 409) {
    setError('label', { message: 'Ce thème existe déjà (accents et majuscules ne comptent pas).' })
  } else if (error.status === 400 && error.fieldErrors.label) {
    setError('label', { message: 'Le nom doit contenir au moins une lettre ou un chiffre.' })
  } else {
    return false
  }
  return true
}

export function AdminTopicsPage() {
  const topics = useAdminTopics()

  return (
    <>
      <PageHeader title="Thèmes" subtitle="Proposés aux lecteurs lors du choix de leurs centres d'intérêt" />
      <div className={table.stack}>
        <CreateTopicForm />
        {topics.isPending ? (
          <LoadingState label="Chargement des thèmes…" />
        ) : topics.isError ? (
          <ErrorState
            message={getErrorMessage(topics.error)}
            onRetry={() => void topics.refetch()}
            retrying={topics.isRefetching}
          />
        ) : topics.data.length === 0 ? (
          <EmptyState title="Aucun thème" description="Créez le premier thème proposé aux lecteurs." />
        ) : (
          <TopicsTable topics={topics.data.filter(hasId)} />
        )}
      </div>
    </>
  )
}

function CreateTopicForm() {
  const createTopic = useCreateTopic()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<TopicValues>({ resolver: zodResolver(topicSchema), defaultValues: { label: '' } })

  const onSubmit = handleSubmit(({ label }) =>
    createTopic.mutate(label, {
      onSuccess: (created) => {
        reset({ label: '' })
        toast.show(`Thème « ${created.label ?? label} » créé`)
      },
      onError: (error) => void setLabelError(error, setError),
    }),
  )

  const formError =
    createTopic.isError && !errors.label ? getErrorMessage(createTopic.error) : null

  return (
    <form className={styles.create} onSubmit={onSubmit} noValidate>
      <TextField
        className={styles.createField}
        label="Nouveau thème"
        placeholder="Nom du thème"
        maxLength={50}
        error={errors.label?.message}
        {...register('label')}
      />
      <Button type="submit" className={styles.createButton} loading={createTopic.isPending}>
        Créer le thème
      </Button>
      {formError && (
        <p role="alert" className={`${table.formError} ${styles.fullRow}`}>
          {formError}
        </p>
      )}
    </form>
  )
}

function TopicsTable({ topics }: { topics: AdminTopic[] }) {
  const [editingId, setEditingId] = useState<number | null>(null)

  return (
    <div className={table.scroller} role="region" aria-label="Liste des thèmes" tabIndex={0}>
      <table className={table.table}>
        <thead>
          <tr>
            <th scope="col" className={styles.nameColumn}>
              Nom
            </th>
            <th scope="col">Articles</th>
            <th scope="col">Lecteurs intéressés</th>
            <th scope="col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {topics.map((topic) => (
            <TopicRow
              key={topic.id}
              topic={topic}
              editing={editingId === topic.id}
              onEdit={() => setEditingId(topic.id)}
              onDone={() => setEditingId(null)}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}

type RowProps = {
  topic: AdminTopic
  editing: boolean
  onEdit: () => void
  onDone: () => void
}

function TopicRow({ topic, editing, onEdit, onDone }: RowProps) {
  const renameButton = useRef<HTMLButtonElement>(null)
  const wasEditing = useRef(false)

  // Leaving edit mode: give the focus back to "Renommer".
  useEffect(() => {
    if (wasEditing.current && !editing) renameButton.current?.focus()
    wasEditing.current = editing
  }, [editing])

  return (
    <tr>
      <th scope="row" className={table.name}>
        {editing ? <RenameForm topic={topic} onDone={onDone} /> : topic.label}
      </th>
      <td className={table.numeric}>{formatCount(topic.articleCount)}</td>
      <td className={table.numeric}>{formatCount(topic.readerCount)}</td>
      <td>
        {!editing && (
          <button
            ref={renameButton}
            type="button"
            className={table.action}
            aria-label={`Renommer ${topic.label}`}
            onClick={onEdit}
          >
            Renommer
          </button>
        )}
      </td>
    </tr>
  )
}

function RenameForm({ topic, onDone }: { topic: AdminTopic; onDone: () => void }) {
  const renameTopic = useRenameTopic()
  const toast = useToast()
  const {
    register,
    handleSubmit,
    setError,
    setFocus,
    formState: { errors, isDirty },
  } = useForm<TopicValues>({ resolver: zodResolver(topicSchema), defaultValues: { label: topic.label ?? '' } })

  useEffect(() => setFocus('label', { shouldSelect: true }), [setFocus])

  const onSubmit = handleSubmit(({ label }) => {
    if (!isDirty) return onDone()
    renameTopic.mutate(
      { id: topic.id, label },
      {
        onSuccess: (renamed) => {
          onDone()
          toast.show(`Thème renommé en « ${renamed.label ?? label} »`)
        },
        onError: (error) => void setLabelError(error, setError),
      },
    )
  })

  const formError =
    renameTopic.isError && !errors.label
      ? renameTopic.error instanceof ApiError && renameTopic.error.status === 404
        ? "Ce thème n'existe plus. Rechargez la page."
        : getErrorMessage(renameTopic.error)
      : null

  return (
    <form
      className={styles.rename}
      onSubmit={onSubmit}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !renameTopic.isPending) onDone()
      }}
      noValidate
    >
      <div className={styles.renameRow}>
        <TextField
          className={styles.renameField}
          label={`Nouveau nom de ${topic.label}`}
          hideLabel
          maxLength={50}
          error={errors.label?.message}
          {...register('label')}
        />
        <Button type="submit" loading={renameTopic.isPending}>
          Enregistrer
        </Button>
        <Button variant="ghost" onClick={onDone} disabled={renameTopic.isPending}>
          Annuler
        </Button>
      </div>
      {formError && (
        <p role="alert" className={table.formError}>
          {formError}
        </p>
      )}
    </form>
  )
}
