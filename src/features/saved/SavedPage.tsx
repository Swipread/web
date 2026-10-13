import { Link } from 'react-router'
import { getErrorMessage } from '../../api/problem'
import type { Schema } from '../../api/types'
import { formatActionDate, formatReadingTime } from '../../lib/format'
import { ArticleRow } from '../../ui/ArticleRow'
import { Button } from '../../ui/Button'
import { EmptyState } from '../../ui/EmptyState'
import { ErrorState } from '../../ui/ErrorState'
import { IconButton } from '../../ui/IconButton'
import { ShareIcon } from '../../ui/icons'
import { LoadingState } from '../../ui/LoadingState'
import { PageHeader } from '../../ui/PageHeader'
import { useShare } from '../share/useShare'
import { tracker } from '../tracking/tracker'
import { useSaved } from './useSaved'
import styles from './SavedPage.module.css'

type Article = Schema<'ArticleResponse'>

export function SavedPage() {
  const saved = useSaved()
  const share = useShare()
  const items = saved.data?.pages.flatMap((page) => page.items ?? []) ?? []
  const subtitle = saved.hasNextPage
    ? 'Vos articles à lire plus tard'
    : `${items.length} article${items.length > 1 ? 's' : ''} à lire plus tard`

  const shareArticle = async (article: Article) => {
    const result = await share(article)
    if (article.id && (result === 'native' || result === 'clipboard')) {
      tracker.track({ type: 'share', articleId: article.id, payload: { channel: result } })
    }
  }

  return (
    <>
      <PageHeader title="Sauvegardés" subtitle={saved.isSuccess && items.length > 0 ? subtitle : undefined} />
      {saved.isPending ? (
        <LoadingState label="Chargement de vos sauvegardes…" />
      ) : saved.isError && items.length === 0 ? (
        <ErrorState
          message={getErrorMessage(saved.error)}
          onRetry={() => void saved.refetch()}
          retrying={saved.isRefetching}
        />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aucun article sauvegardé"
          description="Sauvegardez un article depuis votre fil pour le retrouver ici."
          action={<Link to="/">Parcourir mon fil</Link>}
        />
      ) : (
        <>
          <div className={styles.list}>
            {items.map(({ article, savedAt }) =>
              !article?.id || !article.url ? null : (
                <ArticleRow
                  key={article.id}
                  title={article.title ?? ''}
                  url={article.url}
                  imageUrl={article.imageUrl}
                  meta={[article.sourceName, formatReadingTime(article.wordCount)].filter((part) => !!part) as string[]}
                  caption={formatActionDate('Sauvegardé', savedAt)}
                  onOpen={() => tracker.track({ type: 'open', articleId: article.id! })}
                  actions={
                    // "Retirer" needs an endpoint the API lacks (docs/demandes-backend.md #5).
                    <IconButton
                      icon={<ShareIcon />}
                      label={`Partager « ${article.title} »`}
                      onClick={() => void shareArticle(article)}
                    />
                  }
                />
              ),
            )}
          </div>
          {saved.isFetchNextPageError && (
            <p role="alert" className={styles.error}>
              {getErrorMessage(saved.error)}
            </p>
          )}
          {saved.hasNextPage && (
            <div className={styles.more}>
              <Button variant="secondary" onClick={() => void saved.fetchNextPage()} loading={saved.isFetchingNextPage}>
                Charger plus
              </Button>
            </div>
          )}
        </>
      )}
    </>
  )
}
