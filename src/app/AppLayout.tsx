import { Outlet } from 'react-router'
import { useLogout, useMe } from '../features/auth/useAuth'
import { Sidebar } from './Sidebar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const logout = useLogout()
  const isAdmin = useMe().data?.role === 'ADMIN'
  return (
    <div className={styles.layout}>
      <Sidebar showAdmin={isAdmin} onLogout={logout} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
