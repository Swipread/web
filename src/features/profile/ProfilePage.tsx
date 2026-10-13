import { getErrorMessage } from '../../api/problem'
import { Button } from '../../ui/Button'
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
import styles from './ProfilePage.module.css'

// Editing the display name and deleting the account wait for PATCH/DELETE /v1/me
// (docs/demandes-backend.md #4): the name is shown read-only and the deletion section is left out.
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
          <section className={styles.section} aria-labelledby="profile-info">
            <h2 id="profile-info" className={styles.sectionTitle}>
              Informations
            </h2>
            <div className={styles.fields}>
              <TextField label="Nom affiché" value={me.data.displayName ?? ''} readOnly />
              <TextField label="Email (non modifiable)" value={me.data.email ?? ''} readOnly />
            </div>
          </section>
          <TopicsSection selectedIds={me.data.topics?.flatMap((t) => (t.id === undefined ? [] : [t.id]))} />
        </div>
      )}
    </>
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
