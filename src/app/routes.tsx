import type { RouteObject } from 'react-router'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { FeedPage } from '../features/feed/FeedPage'
import { TopicsPage } from '../features/onboarding/TopicsPage'
import { PageHeader } from '../ui/PageHeader'
import { AppLayout } from './AppLayout'
import { RedirectIfAuthenticated, RequireAuth, RequireOnboarding } from './guards'

// Placeholder pages are replaced as their feature step lands.
export const routes: RouteObject[] = [
  {
    element: <RedirectIfAuthenticated />,
    children: [
      { path: '/connexion', element: <LoginPage /> },
      { path: '/inscription', element: <RegisterPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      { path: '/centres-interet', element: <TopicsPage /> },
      {
        element: <RequireOnboarding />,
        children: [
          {
            element: <AppLayout />,
            children: [
              { index: true, element: <FeedPage /> },
              { path: 'sauvegardes', element: <PageHeader title="Sauvegardés" /> },
              { path: 'historique', element: <PageHeader title="Historique" /> },
              { path: 'profil', element: <PageHeader title="Profil" /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <PageHeader title="Page introuvable" /> },
]
