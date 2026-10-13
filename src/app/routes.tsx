import type { RouteObject } from 'react-router'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { FeedPage } from '../features/feed/FeedPage'
import { TopicsPage } from '../features/onboarding/TopicsPage'
import { ProfilePage } from '../features/profile/ProfilePage'
import { SavedPage } from '../features/saved/SavedPage'
import { AppLayout } from './AppLayout'
import { NotFoundPage } from './NotFoundPage'
import { RedirectIfAuthenticated, RequireAuth, RequireOnboarding } from './guards'

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
              // '/historique' waits for GET /v1/me/history (docs/demandes-backend.md #3).
              { path: 'profil', element: <ProfilePage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]
