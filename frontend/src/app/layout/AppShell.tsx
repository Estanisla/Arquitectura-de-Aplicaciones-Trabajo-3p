import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useAuthSession } from '../../features/auth/session/useAuthSession'

export function AppShell() {
  const navigate = useNavigate()
  const location = useLocation()
  const { status, isAuthenticated, logout } = useAuthSession()

  const handleLogout = async () => {
    await logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="app-shell">
      <header className="app-shell__header app-shell__header--public">
        <Link to="/" className="app-shell__brand">
          Polos Azules
        </Link>
        <nav className="app-shell__actions" aria-label="Acceso vendedor">
          {status === 'loading' ? (
            <span className="app-shell__loading-text">Cargando sesion...</span>
          ) : isAuthenticated ? (
            <>
              <Link to="/profile" className="button-link">
                Perfil
              </Link>
              <button
                type="button"
                className="button-link button-link--secondary"
                onClick={handleLogout}
              >
                Cerrar sesión
              </button>
            </>
          ) : (
            <Link to="/auth/login" className="button-link button-link--secondary">
              Login
            </Link>
          )}
        </nav>
      </header>
      <main className="app-shell__content">
        <div key={location.pathname} className="route-fade">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
