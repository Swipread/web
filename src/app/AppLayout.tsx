import { Outlet } from 'react-router'
import { Sidebar } from './Sidebar'
import styles from './AppLayout.module.css'

export function AppLayout() {
  return (
    <div className={styles.layout}>
      <Sidebar showAdmin={false} />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
