import { NavLink, Outlet } from 'react-router-dom'

const navClassName = ({ isActive }: { isActive: boolean }) =>
  isActive ? 'app-shell__link app-shell__link--active' : 'app-shell__link'

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <h1 className="app-shell__title">Marketplace App</h1>
        <nav className="app-shell__nav" aria-label="Main navigation">
          <NavLink to="/" className={navClassName} end>
            Inicio
          </NavLink>
          <NavLink to="/auth/login" className={navClassName}>
            Login vendedor
          </NavLink>
          <NavLink to="/vendor" className={navClassName}>
            Area vendedor
          </NavLink>
          <NavLink to="/admin" className={navClassName}>
            Area company-admin
          </NavLink>
        </nav>
      </header>
      <main className="app-shell__content">
        <Outlet />
      </main>
    </div>
  )
}
