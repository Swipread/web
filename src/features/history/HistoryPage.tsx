import { Link } from 'react-router'
import { getErrorMessage } from '../../api/problem'
import type { Schema } from '../../api/types'
import { formatReadAt, formatReadingTime, recencyGroup, type RecencyGroup } from '../../lib/format'
import { ArticleRow } from '../../ui/ArticleRow'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { LoadingState } from '../../ui/LoadingState'
import { PageHeader } from '../../ui/PageHeader'
import { tracker } from '../tracking/tracker'
import { useHistory } from './useHistory'
import styles from './HistoryPage.module.css'

type HistoryItem = Schema<'HistoryItemResponse'>

const groupTitles: Record<RecencyGroup, string> = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  older: 'Plus ancien',
}

/** Items come most recent first, so groups come out in order. */
function groupByRecency(items: HistoryItem[], now = Date.now()) {
  const groups: { key: RecencyGroup; items: HistoryItem[] }[] = []
  for (const item of items) {
    const key = recencyGroup(item.readAt, now)
    const last = groups.at(-1)
    if (last?.key === key) last.items.push(item)
    else groups.push({ key, items: [item] })
  }
  return groups
}

export function HistoryPage() {
  const history = useHistory()
  const items = history.data?.pages.flatMap((page) => page.items ?? []) ?? []

  return (
    <>
      <PageHeader title="Historique" subtitle="Les articles que vous avez lus récemment" />
      {history.isPending ? (
        <LoadingState label="Chargement de votre historique…" />
      ) : history.isError && items.length === 0 ? (
        <ErrorState
          message={getErrorMessage(history.error)}
          onRetry={() => void history.refetch()}
          retrying={history.isRefetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun article lu pour le moment"
          description="Les articles que vous ouvrez depuis votre fil apparaîtront ici."
          action={<Link to="/">Parcourir mon fil</Link>}
        />
      ) : (
        <>
          {groupByRecency(items).map((group) => (
            <section key={group.key} className={styles.group} aria-labelledby={`history-${group.key}`}>
              <h2 id={`history-${group.key}`} className={styles.groupTitle}>
                {groupTitles[group.key]}
              </h2>
              {group.items.map(({ article, readAt }) => {
                if (!article?.id || !article.url) return null
                const open = () => tracker.track({ type: 'open', articleId: article.id! })
                return (
                  <ArticleRow
                    key={article.id}
                    headingLevel={3}
                    title={article.title ?? ''}
                    url={article.url}
                    imageUrl={article.imageUrl}
                    meta={[article.sourceName, formatReadingTime(article.wordCount)].filter((part) => !!part) as string[]}
                    caption={formatReadAt(readAt)}
                    onOpen={open}
                    actions={
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.reread}
                        onClick={open}
                      >
                        Relire{' '}
                        <span className="visually-hidden">« {article.title} » (nouvel onglet)</span>
                      </a>
                    }
                  />
                )
              })}
            </section>
          ))}
          {history.isFetchNextPageError && (
            <p role="alert" className={styles.error}>
              {getErrorMessage(history.error)}
            </p>
          )}
          {history.hasNextPage && (
            <div className={styles.more}>
              <Button
                variant="secondary"
                onClick={() => void history.fetchNextPage()}
                loading={history.isFetchingNextPage}
              >
                Charger plus
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
