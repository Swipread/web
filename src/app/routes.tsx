import { Navigate, type RouteObject } from 'react-router'
import { AdminTopicsPage } from '../features/admin/AdminTopicsPage'
import { SourcesPage } from '../features/admin/SourcesPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { FeedPage } from '../features/feed/FeedPage'
import { HistoryPage } from '../features/history/HistoryPage'
import { TopicsPage } from '../features/onboarding/TopicsPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { SavedPage } from '../features/saved/SavedPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'
import { RedirectIfAuthenticated, RequireAdmin, RequireAuth, RequireOnboarding } from './guards'

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
              { path: 'sauvegardes', element: <SavedPage /> },
              { path: 'historique', element: <HistoryPage /> },
              { path: 'profil', element: <ProfilePage /> },
              {
                path: 'admin',
                element: <RequireAdmin />,
                children: [
                  { index: true, element: <Navigate to="sources" replace /> },
                  { path: 'sources', element: <SourcesPage /> },
                  { path: 'themes', element: <AdminTopicsPage /> },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
