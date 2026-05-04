import { Navigate } from 'react-router-dom'
import { useAuthSession } from '../../auth/session/useAuthSession'

export function ProfilePage() {
  const { status, isAuthenticated, userId, logout } = useAuthSession()

  if (status === 'loading') {
    return (
      <section className="card">
        <h2>Perfil</h2>
        <p>Cargando sesion...</p>
      </section>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />
  }

  const handleLogout = async () => {
    await logout()
  }

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Perfil vendedor (placeholder)</h2>
        <p>Sesion JWT activa para este usuario.</p>
        <p>
          <strong>user_id:</strong> {userId ?? 'no disponible'}
        </p>
      </article>
      <article className="card">
        <button type="button" className="button-link button-link--secondary" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </article>
    </section>
  )
}
