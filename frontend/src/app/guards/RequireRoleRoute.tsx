import { Navigate } from 'react-router-dom'
import type { AuthRole } from '../../features/auth/types'
import { useAuthSession } from '../../features/auth/session/useAuthSession'

type RequireRoleRouteProps = {
  children: React.ReactNode
  allowedRoles: AuthRole[]
}

export function RequireRoleRoute({
  children,
  allowedRoles,
}: RequireRoleRouteProps) {
  const { status, role } = useAuthSession()

  if (status === 'loading') {
    return (
      <section className="card">
        <p>Cargando sesion...</p>
      </section>
    )
  }

  if (status === 'anonymous') {
    return <Navigate to="/auth/login" replace />
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}
