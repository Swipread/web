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
  const buttons = [
    { label: "J'aime", icon: <HeartIcon filled={card.liked} size={22} />, pressed: card.liked, onClick: onToggleLike },
    { label: 'Sauvegarder', icon: <BookmarkIcon filled={card.saved} size={22} />, pressed: card.saved, onClick: onToggleSave },
    { label: 'Partager', icon: <ShareIcon size={22} />, onClick: onShare },
    { label: 'Pas intéressé', icon: <CloseIcon size={22} />, onClick: onHide },
  ]
  return (
    <div className={styles.actions} role="group" aria-label="Actions sur l'article">
      {buttons.map(({ label, ...button }) => (
        <IconButton key={label} label={label} title={label} variant="ambient" {...button} />
      ))}
    </div>
  )
}
