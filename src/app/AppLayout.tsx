import { Outlet, useLocation } from 'react-router'
import { EmailVerificationBanner } from '../features/auth/EmailVerificationBanner'
import { useLogout, useMe } from '../features/auth/useAuth'
import { Sidebar } from './Sidebar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const logout = useLogout()
  const isAdmin = useMe().data?.role === 'ADMIN'
  // The feed is immersive: edge to edge, its own light behind it.
  const immersive = useLocation().pathname === '/'
  return (
    <div className={styles.layout}>
      <Sidebar showAdmin={isAdmin} onLogout={logout} />
      <main className={styles.main} data-immersive={immersive || undefined}>
        <EmailVerificationBanner />
        <Outlet />
      </main>
    </div>
  )
}
