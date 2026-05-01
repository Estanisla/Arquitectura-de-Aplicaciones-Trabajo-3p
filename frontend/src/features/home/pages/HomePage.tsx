import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="card-stack">
      <article className="card">
        <h2>Base de aplicacion</h2>
        <p>
          Frontend alineado a arquitectura por modulos. Esta base prioriza login
          vendedor y separacion de placeholders por rol.
        </p>
      </article>

      <article className="card">
        <h2>Flujo vendedor</h2>
        <p>
          Integra <code>POST /api/auth/login</code> contra backend para validar
          credenciales actuales.
        </p>
        <Link to="/auth/login" className="button-link">
          Ir a login vendedor
        </Link>
      </article>

      <article className="card">
        <h2>Rutas por rol</h2>
        <p>
          Seccion vendedor y company-admin quedan separadas desde esta iteracion
          con placeholders listos para siguientes historias.
        </p>
        <div className="button-row">
          <Link to="/vendor" className="button-link">
            Ver vendedor
          </Link>
          <Link to="/admin" className="button-link">
            Ver company-admin
          </Link>
        </div>
      </article>
    </section>
  )
}
