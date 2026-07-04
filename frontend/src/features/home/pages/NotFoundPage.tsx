import { Link } from 'react-router-dom'
import { useAuthSession } from '../../auth/session/useAuthSession'

export function NotFoundPage() {
  const { role, isAuthenticated } = useAuthSession()

  const target = isAuthenticated
    ? role === 'admin'
      ? { to: '/admin', label: 'Ir al panel de administracion' }
      : { to: '/vendor', label: 'Ir al panel de vendedor' }
    : { to: '/', label: 'Volver al inicio' }

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Pagina no encontrada</h2>
        <p>La ruta que intentaste abrir no existe o fue movida.</p>
      </article>
      <article className="card">
        <Link to={target.to} className="button-link">
          {target.label}
        </Link>
      </article>
    </section>
  )
}
