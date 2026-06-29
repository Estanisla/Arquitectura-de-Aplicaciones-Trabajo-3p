import { Navigate } from 'react-router-dom'
import { useAuthSession } from '../../auth/session/useAuthSession'

export function ProfilePage() {
  const { status, isAuthenticated, role, logout } = useAuthSession()

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

  const profile =
    role === 'admin'
      ? {
          title: 'Perfil de administrador',
          message: 'Sesion activa con permisos de administracion.',
        }
      : {
          title: 'Perfil de vendedor',
          message: 'Sesion activa como vendedor.',
        }

  return (
    <section className="card-stack">
      <article className="card">
        <h2>{profile.title}</h2>
        <p>{profile.message}</p>
      </article>
      <article className="card">
        <button type="button" className="button-link button-link--secondary" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </article>
    </section>
  )
}
