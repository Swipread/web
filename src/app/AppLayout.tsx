import { Outlet } from 'react-router'
import { useLogout } from '../features/auth/useAuth'
import { Sidebar } from './Sidebar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const logout = useLogout()
  return (
    <div className={styles.layout}>
      {/* Admin links stay hidden until the API exposes the user's role (docs/demandes-backend.md #2). */}
      <Sidebar showAdmin={false} onLogout={logout} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
