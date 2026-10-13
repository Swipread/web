import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import {
  BookmarkIcon,
  HomeIcon,
  LogoutIcon,
  RssIcon,
  TagIcon,
  UserIcon,
} from '../ui/icons'
import styles from './Sidebar.module.css'

type NavItem = { to: string; label: string; icon: ReactNode }

const readerItems: NavItem[] = [
  { to: '/', label: 'Pour vous', icon: <HomeIcon /> },
  { to: '/sauvegardes', label: 'Sauvegardés', icon: <BookmarkIcon /> },
  // Historique is hidden until the API exposes reading history (docs/demandes-backend.md #3).
  { to: '/profil', label: 'Profil', icon: <UserIcon /> },
]

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
        <NavList items={readerItems} />
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
        <li key={item.to}>
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
