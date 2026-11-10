import { NavLink, Outlet } from 'react-router'
import styles from './AdminLayout.module.css'

/** On mobile the tab bar has a single "Admin" entry: these tabs switch between the admin pages. */
export function AdminLayout() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [styles.tab, isActive && styles.active].filter(Boolean).join(' ')

  return (
    <>
      <nav aria-label="Pages d'administration" className={styles.tabs}>
        <NavLink to="/admin/sources" className={linkClass}>
          Sources
        </NavLink>
        <NavLink to="/admin/themes" className={linkClass}>
          Thèmes
        </NavLink>
      </nav>
      <Outlet />
    </>
  )
}
