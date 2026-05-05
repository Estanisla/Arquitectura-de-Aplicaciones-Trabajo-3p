import { Link, Outlet } from 'react-router-dom'
import { useAuthSession } from '../../features/auth/session/useAuthSession'

export function AppShell() {
  const { status, isAuthenticated } = useAuthSession()

  return (
    <div className="app-shell">
      <header className="app-shell__header app-shell__header--public">
        <Link to="/" className="app-shell__brand">
          Marketplace App
        </Link>
        <nav className="app-shell__actions" aria-label="Acceso vendedor">
          {status === 'loading' ? (
            <span className="app-shell__loading-text">Cargando sesion...</span>
          ) : isAuthenticated ? (
            <Link to="/profile" className="button-link">
              Perfil
            </Link>
          ) : (
            <>
              <Link to="/auth/login" className="button-link button-link--secondary">
                Login
              </Link>
              <Link to="/auth/register" className="button-link">
                Create account
              </Link>
            </>
          )}
        </nav>
      </header>
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  )
}
