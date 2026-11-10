import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import {
  BookmarkIcon,
  ClockIcon,
  HomeIcon,
  LogoutIcon,
  RssIcon,
  SlidersIcon,
  TagIcon,
  UserIcon,
} from '../ui/icons'
import styles from './Sidebar.module.css'

type NavItem = {
  to: string
  label: string
  icon: ReactNode
  /** Only in the mobile tab bar. */
  mobileOnly?: boolean
}

const readerItems: NavItem[] = [
  { to: '/', label: 'Pour vous', icon: <HomeIcon /> },
  { to: '/sauvegardes', label: 'Sauvegardés', icon: <BookmarkIcon /> },
  { to: '/historique', label: 'Historique', icon: <ClockIcon /> },
  { to: '/profil', label: 'Profil', icon: <UserIcon /> },
]

// The tab bar has no room for both admin links: one entry, the admin pages switch between them.
const adminTab: NavItem = { to: '/admin', label: 'Admin', icon: <SlidersIcon />, mobileOnly: true }

const adminItems: NavItem[] = [
  { to: '/admin/sources', label: 'Sources', icon: <RssIcon /> },
  { to: '/admin/themes', label: 'Thèmes', icon: <TagIcon /> },
]

type Props = {
  showAdmin: boolean
  onLogout?: () => void
}

export function Sidebar({ showAdmin, onLogout }: Props) {
  return (
    <aside className={styles.sidebar}>
      <p className={styles.brand}>Swipread</p>
      <nav aria-label="Navigation principale" className={styles.nav}>
        <NavList items={showAdmin ? [...readerItems, adminTab] : readerItems} />
        {showAdmin && (
          <div className={styles.group}>
            <p className={styles.groupTitle} id="admin-nav-title">
              Administration
            </p>
            <NavList items={adminItems} labelledBy="admin-nav-title" />
          </div>
        )}
      </nav>
      {onLogout && (
        <button type="button" className={styles.logout} onClick={onLogout}>
          <LogoutIcon />
          <span className={styles.label}>Se déconnecter</span>
        </button>
      )}
    </aside>
  )
}

function NavList({ items, labelledBy }: { items: NavItem[]; labelledBy?: string }) {
  return (
    <ul className={styles.list} aria-labelledby={labelledBy}>
      {items.map((item) => (
        <li key={item.to} className={item.mobileOnly ? styles.mobileOnly : undefined}>
          <NavLink
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => [styles.link, isActive && styles.active].filter(Boolean).join(' ')}
          >
            {item.icon}
            <span className={styles.label}>{item.label}</span>
          </NavLink>
        </li>
      ))}
    </ul>
  )
}
