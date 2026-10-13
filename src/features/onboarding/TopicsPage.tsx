import { useNavigate } from 'react-router'
import { getErrorMessage } from '../../api/problem'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { LoadingState } from '../../ui/LoadingState'
import { useMe } from '../auth/useAuth'
import { selectionLabel } from './selectionLabel'
import { TopicPicker } from './TopicPicker'
import { MIN_TOPICS, useTopics, useUpdateTopics } from './useTopics'
import { useTopicSelection } from './useTopicSelection'
import styles from './TopicsPage.module.css'

export function TopicsPage() {
  const topics = useTopics()
  const me = useMe()
  const updateTopics = useUpdateTopics()
  const navigate = useNavigate()
  const selection = useTopicSelection(me.data?.topics?.flatMap((t) => (t.id === undefined ? [] : [t.id])))
  const count = selection.selected.size

  const submit = () =>
    updateTopics.mutate([...selection.selected], {
      onSuccess: () => void navigate('/', { replace: true }),
    })

  return (
    <main className={styles.page}>
      <p className={styles.brand}>Swipread</p>
      <h1 className={styles.title}>Qu'est-ce qui vous intéresse ?</h1>
      <p className={styles.subtitle}>
        Choisissez au moins {MIN_TOPICS} thèmes. Vous pourrez les modifier à tout moment.
      </p>

      {topics.isPending ? (
        <LoadingState label="Chargement des thèmes…" />
      ) : topics.isError ? (
        <ErrorState
          message={getErrorMessage(topics.error)}
          onRetry={() => void topics.refetch()}
          retrying={topics.isRefetching}
        />
      ) : topics.data.length === 0 ? (
        <EmptyState
          title="Aucun thème disponible"
          description="Les thèmes ne sont pas encore configurés. Revenez dans quelques instants."
        />
      ) : (
        <>
          <TopicPicker topics={topics.data} selectedIds={selection.selected} onToggle={selection.toggle} />
          <p className={styles.count} aria-live="polite">
            {selectionLabel(count, MIN_TOPICS)}
          </p>
          {updateTopics.isError && (
            <p role="alert" className={styles.error}>
              {getErrorMessage(updateTopics.error)}
            </p>
          )}
          <Button onClick={submit} disabled={count < MIN_TOPICS} loading={updateTopics.isPending}>
            Continuer vers mon fil
          </Button>
        </>
      )}
    </main>
  )
}
