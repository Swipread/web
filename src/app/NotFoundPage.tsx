import { Link } from 'react-router'
import { EmptyState } from '../ui/EmptyState'

export function NotFoundPage() {
  return (
    <main>
      <EmptyState
        title="Page introuvable"
        description="Cette page n'existe pas ou n'est plus disponible."
        action={<Link to="/">Retour au fil</Link>}
      />
    </main>
  )
}
