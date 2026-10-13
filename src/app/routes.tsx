import type { RouteObject } from 'react-router'
import { PageHeader } from '../ui/PageHeader'
import { AppLayout } from './AppLayout'

// Pages are placeholders until their feature step lands.
export const routes: RouteObject[] = [
  { path: '/connexion', element: <PageHeader title="Se connecter" /> },
  { path: '/inscription', element: <PageHeader title="Créer un compte" /> },
  { path: '/centres-interet', element: <PageHeader title="Qu'est-ce qui vous intéresse ?" /> },
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <PageHeader title="Pour vous" /> },
      { path: 'sauvegardes', element: <PageHeader title="Sauvegardés" /> },
      { path: 'historique', element: <PageHeader title="Historique" /> },
      { path: 'profil', element: <PageHeader title="Profil" /> },
    ],
  },
  { path: '*', element: <PageHeader title="Page introuvable" /> },
]
