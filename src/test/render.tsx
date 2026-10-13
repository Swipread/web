import type { ReactElement } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, type RouteObject } from 'react-router'

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
}

/** Renders a component tree with Query and a memory router at `path`. */
export function renderWithProviders(ui: ReactElement, { path = '/' }: { path?: string } = {}) {
  return renderRoutes([{ path: '*', element: ui }], { path })
}

/** Renders a full route table, e.g. to assert redirects. */
export function renderRoutes(routes: RouteObject[], { path = '/' }: { path?: string } = {}) {
  const queryClient = createTestQueryClient()
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const user = userEvent.setup()
  const result = render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  )
  return { ...result, user, router, queryClient }
}
