import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { setUnauthorizedHandler } from './api/client'
import { queryClient } from './api/queryClient'
import { routes } from './app/routes'
import { createUnauthorizedHandler } from './app/unauthorized'
import { startTracking } from './features/tracking/tracker'
import { ToastProvider } from './ui/ToastProvider'
import './ui/global.css'

const router = createBrowserRouter(routes)
setUnauthorizedHandler(createUnauthorizedHandler(router, queryClient))
startTracking()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
