import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { BookmarkIcon, ClockIcon, HomeIcon, SlidersIcon, UserIcon } from '../ui/icons'
import styles from './TabBar.module.css'

type Tab = { to: string; label: string; icon: ReactNode }

const readerTabs: Tab[] = [
  { to: '/', label: 'Pour vous', icon: <HomeIcon size={22} /> },
  { to: '/sauvegardes', label: 'Sauvegardés', icon: <BookmarkIcon size={22} /> },
  { to: '/historique', label: 'Historique', icon: <ClockIcon size={22} /> },
  { to: '/profil', label: 'Profil', icon: <UserIcon size={22} /> },
]

// One entry for both admin pages: they switch between themselves (AdminLayout).
const adminTab: Tab = { to: '/admin', label: 'Admin', icon: <SlidersIcon size={22} /> }

type Props = {
  showAdmin: boolean
  /** `ambient` over the feed's field, `paper` on the other pages. */
  tone: 'ambient' | 'paper'
}

/** The main navigation, at the bottom on every screen size. */
export function TabBar({ showAdmin, tone }: Props) {
  const tabs = showAdmin ? [...readerTabs, adminTab] : readerTabs
  return (
    <nav aria-label="Navigation principale" className={`${styles.bar} ${styles[tone]}`}>
      <ul className={styles.list}>
        {tabs.map((tab) => (
          <li key={tab.to}>
            <NavLink
              to={tab.to}
              end={tab.to === '/'}
              className={({ isActive }) => [styles.tab, isActive && styles.active].filter(Boolean).join(' ')}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
