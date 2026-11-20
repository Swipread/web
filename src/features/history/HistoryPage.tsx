import { Link } from 'react-router'
import { getErrorMessage } from '../../api/problem'
import type { Schema } from '../../api/types'
import { formatReadAt, formatReadingTime, recencyGroup, type RecencyGroup } from '../../lib/format'
import { ArticleRow } from '../../ui/ArticleRow'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { IconButton } from '../../ui/IconButton'
import { ReadingTime } from '../../ui/ReadingTime'
import { BookmarkIcon, ShareIcon } from '../../ui/icons'
import { LoadingState } from '../../ui/LoadingState'
import { PageHeader } from '../../ui/PageHeader'
import { useShare } from '../share/useShare'
import { tracker } from '../tracking/tracker'
import { useHistory, useHistorySave } from './useHistory'
import styles from './HistoryPage.module.css'

type HistoryItem = Schema<'HistoryItemResponse'>
type Article = Schema<'ArticleResponse'>

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
  const toggleSave = useHistorySave()
  const share = useShare()
  const items = history.data?.pages.flatMap((page) => page.items ?? []) ?? []

  const shareArticle = async (article: Article) => {
    const result = await share(article)
    if (article.id && (result === 'native' || result === 'clipboard')) {
      tracker.track({ type: 'share', articleId: article.id, payload: { channel: result } })
    }
  }

  return (
    <div className={styles.page}>
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
              {group.items.map(({ article, readAt, saved }) => {
                if (!article?.id || !article.url) return null
                const articleId = article.id
                return (
                  <ArticleRow
                    key={articleId}
                    headingLevel={3}
                    title={article.title ?? ''}
                    url={article.url}
                    imageUrl={article.imageUrl}
                    topicSlug={article.topics?.[0]?.slug}
                    meta={[article.sourceName, article.topics?.[0]?.label]}
                    caption={[
                      formatReadAt(readAt),
                      formatReadingTime(article.wordCount, article.wordCountFromSummary) && (
                        <ReadingTime
                          key="time"
                          wordCount={article.wordCount}
                          fromSummary={article.wordCountFromSummary}
                        />
                      ),
                    ]}
                    onOpen={() => tracker.track({ type: 'open', articleId })}
                    actions={
                      <>
                        <IconButton
                          size="sm"
                          icon={<BookmarkIcon filled={saved} />}
                          label={`Sauvegarder « ${article.title} »`}
                          title={saved ? 'Retirer des sauvegardés' : 'Sauvegarder'}
                          pressed={saved ?? false}
                          onClick={() => toggleSave(articleId, !saved)}
                        />
                        <IconButton
                          size="sm"
                          icon={<ShareIcon />}
                          label={`Partager « ${article.title} »`}
                          title="Partager"
                          onClick={() => void shareArticle(article)}
                        />
                      </>
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
    </div>
  )
}
