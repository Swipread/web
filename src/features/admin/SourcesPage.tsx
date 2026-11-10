import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { ApiError, getErrorMessage } from '../../api/problem'
import type { Schema } from '../../api/types'
import { Button } from '../../ui/Button'
import { ConfirmDialog } from '../../ui/ConfirmDialog'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { LoadingState } from '../../ui/LoadingState'
import { PageHeader } from '../../ui/PageHeader'
import { TextField } from '../../ui/TextField'
import { useToast } from '../../ui/toastContext'
import { feedCheckMessage } from './feedProblem'
import { sourceSchema, type SourceValues } from './schemas'
import { useCreateSource, useDeleteSource, useSetSourceActive, useSources } from './useSources'
import table from './AdminTable.module.css'
import styles from './SourcesPage.module.css'

type Source = Schema<'SourceResponse'> & { id: number }

const hasId = (source: Schema<'SourceResponse'>): source is Source => source.id !== undefined

export function SourcesPage() {
  const sources = useSources()
  const nameFieldId = useId()

  return (
    <>
      <PageHeader
        title="Sources d'articles"
        subtitle="Seules les sources actives alimentent le fil"
        actions={<Button onClick={() => document.getElementById(nameFieldId)?.focus()}>Ajouter une source</Button>}
      />
      <div className={table.stack}>
        {sources.isPending ? (
          <LoadingState label="Chargement des sources…" />
        ) : sources.isError ? (
          <ErrorState
            message={getErrorMessage(sources.error)}
            onRetry={() => void sources.refetch()}
            retrying={sources.isRefetching}
          />
        ) : sources.data.length === 0 ? (
          <EmptyState title="Aucune source" description="Ajoutez la première source avec le formulaire ci-dessous." />
        ) : (
          <SourcesTable sources={sources.data.filter(hasId)} />
        )}
        <SourceForm nameFieldId={nameFieldId} />
      </div>
    </>
  )
}

function SourcesTable({ sources }: { sources: Source[] }) {
  const setActive = useSetSourceActive()
  const toast = useToast()
  const [deleting, setDeleting] = useState<Source | null>(null)

  const toggle = (source: Source) =>
    setActive.mutate(
      { id: source.id, active: !source.active },
      {
        onSuccess: (updated) => toast.show(updated.active ? 'Source activée' : 'Source désactivée'),
        onError: (error) => toast.show(getErrorMessage(error)),
      },
    )

  return (
    <>
      <div className={table.scroller} role="region" aria-label="Liste des sources" tabIndex={0}>
        <table className={table.table}>
          <thead>
            <tr>
              <th scope="col">Nom</th>
              <th scope="col">URL du flux</th>
              <th scope="col">Langue</th>
              <th scope="col">Licence</th>
              <th scope="col">Statut</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sources.map((source) => {
              const toggling = setActive.isPending && setActive.variables.id === source.id
              const toggleLabel = source.active ? 'Désactiver' : 'Activer'
              return (
                <tr key={source.id}>
                  <th scope="row" className={table.name}>
                    {source.name}
                  </th>
                  <td className={styles.url} title={source.feedUrl}>
                    {source.feedUrl}
                  </td>
                  <td>{source.language?.toUpperCase()}</td>
                  <td className={source.license ? undefined : table.muted}>{source.license ?? '—'}</td>
                  <td>
                    <span className={source.active ? styles.active : styles.inactive}>
                      {source.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={table.actions}>
                      <button
                        type="button"
                        className={table.action}
                        aria-label={`${toggleLabel} ${source.name}`}
                        disabled={toggling}
                        aria-busy={toggling || undefined}
                        onClick={() => toggle(source)}
                      >
                        {toggleLabel}
                      </button>
                      <span className={table.separator} aria-hidden="true">
                        ·
                      </span>
                      <button
                        type="button"
                        className={`${table.action} ${table.danger}`}
                        aria-label={`Supprimer ${source.name}`}
                        onClick={() => setDeleting(source)}
                      >
                        Supprimer
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <DeleteSourceDialog source={deleting} onClose={() => setDeleting(null)} />
    </>
  )
}

/** Deletion only works for sources without articles: on 409, offer to deactivate instead. */
function DeleteSourceDialog({ source, onClose }: { source: Source | null; onClose: () => void }) {
  const deleteSource = useDeleteSource()
  const setActive = useSetSourceActive()
  const toast = useToast()
  const hasArticles = deleteSource.error instanceof ApiError && deleteSource.error.status === 409

  const close = () => {
    deleteSource.reset()
    setActive.reset()
    onClose()
  }

  const confirm = () => {
    if (!source) return
    if (!hasArticles) {
      deleteSource.mutate(source.id, {
        onSuccess: () => {
          close()
          toast.show('Source supprimée')
        },
      })
    } else if (source.active) {
      setActive.mutate(
        { id: source.id, active: false },
        {
          onSuccess: () => {
            close()
            toast.show('Source désactivée')
          },
        },
      )
    } else {
      close()
    }
  }

  const error = hasArticles
    ? setActive.isError
      ? getErrorMessage(setActive.error)
      : null
    : deleteSource.isError
      ? getErrorMessage(deleteSource.error)
      : null

  return (
    <ConfirmDialog
      open={source !== null}
      title={hasArticles ? 'Cette source a déjà des articles' : `Supprimer « ${source?.name ?? ''} » ?`}
      confirmLabel={hasArticles ? (source?.active ? 'Désactiver la source' : 'Compris') : 'Supprimer'}
      danger={!hasArticles}
      pending={deleteSource.isPending || setActive.isPending}
      error={error}
      onConfirm={confirm}
      onCancel={close}
    >
      {hasArticles ? (
        <p>
          La supprimer effacerait ses articles, ainsi que les sauvegardés et l'historique des lecteurs.
          {source?.active
            ? ' Désactivez-la plutôt\u00a0: elle n’alimentera plus le fil.'
            : ' Elle est déjà désactivée et n’alimente plus le fil.'}
        </p>
      ) : (
        <p>Seule une source sans article peut être supprimée. Cette action est irréversible.</p>
      )}
    </ConfirmDialog>
  )
}

const emptySource: SourceValues = { name: '', siteUrl: '', feedUrl: '', language: 'fr', license: '' }

function SourceForm({ nameFieldId }: { nameFieldId: string }) {
  const createSource = useCreateSource()
  const toast = useToast()
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<SourceValues>({ resolver: zodResolver(sourceSchema), defaultValues: emptySource })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    createSource.mutate(values, {
      onSuccess: (created) => {
        reset(emptySource)
        toast.show(`Source « ${created.name ?? values.name} » ajoutée`)
      },
      onError: (error) => {
        if (!(error instanceof ApiError)) return setFormError(getErrorMessage(error))
        if (error.status === 409) return setError('feedUrl', { message: 'Une source utilise déjà ce flux.' })
        if (error.status === 422) return setError('feedUrl', { message: feedCheckMessage(error.problem?.detail) })
        const fields = Object.keys(emptySource) as (keyof SourceValues)[]
        const invalid = fields.filter((field) => error.fieldErrors[field])
        for (const field of invalid) setError(field, { message: error.fieldErrors[field] })
        if (invalid.length === 0) setFormError(error.message)
      },
    })
  })

  return (
    <section className={table.panel} aria-labelledby="new-source-title">
      <h2 id="new-source-title" className={table.panelTitle}>
        Nouvelle source
      </h2>
      <form className={styles.form} onSubmit={onSubmit} noValidate>
        <div className={styles.fields}>
          <TextField
            id={nameFieldId}
            label="Nom"
            placeholder="Nom de la source"
            maxLength={100}
            error={errors.name?.message}
            {...register('name')}
          />
          <TextField
            label="URL du site"
            type="url"
            inputMode="url"
            placeholder="https://…"
            error={errors.siteUrl?.message}
            {...register('siteUrl')}
          />
          <TextField
            label="URL du flux"
            type="url"
            inputMode="url"
            placeholder="https://…"
            hint="Flux RSS ou Atom, vérifié avant l'ajout"
            error={errors.feedUrl?.message}
            {...register('feedUrl')}
          />
          <TextField
            label="Langue"
            placeholder="fr"
            maxLength={2}
            autoCapitalize="none"
            hint="Code à deux lettres (fr, en…)"
            error={errors.language?.message}
            {...register('language')}
          />
          <TextField
            label="Licence (facultatif)"
            placeholder="Conditions de réutilisation"
            maxLength={200}
            error={errors.license?.message}
            {...register('license')}
          />
        </div>
        {formError && (
          <p role="alert" className={table.formError}>
            {formError}
          </p>
        )}
        <div className={styles.submit}>
          <Button type="submit" loading={createSource.isPending}>
            Vérifier et ajouter
          </Button>
          <p className={table.muted} aria-live="polite">
            {createSource.isPending ? 'Vérification du flux…' : ''}
          </p>
        </div>
      </form>
    </section>
  )
}
