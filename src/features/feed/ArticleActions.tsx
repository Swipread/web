import { IconButton } from '../../ui/IconButton'
import { BookmarkIcon, CloseIcon, HeartIcon, ShareIcon } from '../../ui/icons'
import type { FeedCard } from './useFeed'
import styles from './ArticleActions.module.css'

type Props = {
  card: FeedCard
  onToggleLike: () => void
  onToggleSave: () => void
  onShare: () => void
  onHide: () => void
}

export function ArticleActions({ card, onToggleLike, onToggleSave, onShare, onHide }: Props) {
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
      <IconButton
        icon={<BookmarkIcon filled={card.saved} />}
        label="Sauvegarder"
        showLabel
        pressed={card.saved}
        onClick={onToggleSave}
      />
      <IconButton icon={<ShareIcon />} label="Partager" showLabel onClick={onShare} />
      <IconButton icon={<CloseIcon />} label="Pas intéressé" showLabel onClick={onHide} />
    </div>
  )
}
