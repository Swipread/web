import { IconButton } from '../../ui/IconButton'
import { BookmarkIcon, CloseIcon, HeartIcon, ShareIcon } from '../../ui/icons'
import type { FeedCard } from './useFeed'
import styles from './ArticleActions.module.css'

type Props = {
  card: FeedCard
  onToggleLike: () => void
  onSave: () => void
  onShare: () => void
  onHide: () => void
}

export function ArticleActions({ card, onToggleLike, onSave, onShare, onHide }: Props) {
  return (
    <div className={styles.actions} role="group" aria-label="Actions sur l'article">
      <IconButton
        icon={<HeartIcon filled={card.liked} />}
        label="J'aime"
        showLabel
        tone="like"
        pressed={card.liked}
        onClick={onToggleLike}
      />
      {/* Saving cannot be undone yet: the API has no way to unsave (docs/demandes-backend.md #5). */}
      <IconButton
        icon={<BookmarkIcon filled={card.saved} />}
        label={card.saved ? 'Sauvegardé' : 'Sauvegarder'}
        showLabel
        pressed={card.saved}
        disabled={card.saved}
        onClick={onSave}
      />
      <IconButton icon={<ShareIcon />} label="Partager" showLabel onClick={onShare} />
      <IconButton icon={<CloseIcon />} label="Pas intéressé" showLabel onClick={onHide} />
    </div>
  )
}
