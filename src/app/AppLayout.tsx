import { Outlet, useLocation } from 'react-router'
import { EmailVerificationBanner } from '../features/auth/EmailVerificationBanner'
import { useMe } from '../features/auth/useAuth'
import { TabBar } from './TabBar'
import { TopBar } from './TopBar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  const isAdmin = useMe().data?.role === 'ADMIN'
  // The feed is immersive: edge to edge, its own light behind it, its own top bar over it.
  const immersive = useLocation().pathname === '/'
  return (
    <div className={styles.layout}>
      {!immersive && <TopBar tone="paper" />}
      <main className={styles.main} data-immersive={immersive || undefined}>
        <EmailVerificationBanner />
        <Outlet />
      </main>
      <TabBar showAdmin={isAdmin} tone={immersive ? 'ambient' : 'paper'} />
    </div>
  )
}
