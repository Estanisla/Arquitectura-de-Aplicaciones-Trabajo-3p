import { Link } from 'react-router-dom'

export function HomePage() {
  return (
    <section className="card-stack">
      <article className="card landing-hero">
        <h2>Marketplace para clientes y vendedores</h2>
        <p>
          Esta pagina principal es publica para cualquier usuario. El acceso de
          vendedores se realiza con los botones de la parte superior derecha:
          <strong> Login</strong> y <strong>Create account</strong>.
        </p>
        <p>
          El registro de cuenta esta disponible solo para vendedores. Los
          company-admin tienen un acceso separado y no usan auto-registro.
        </p>
        <p>
          Si eres company-admin, entra por{' '}
          <Link to="/auth/lg-admin" className="inline-link">
            /auth/lg-admin
          </Link>
          .
        </p>
      </article>

      <article className="card">
        <h2>Funcionalidades activas</h2>
        <p>
          El proyecto actualmente soporta onboarding vendedor (registro + login)
          y mantiene la separacion entre area vendedor y area company-admin.
        </p>
        <p>
          Login vendedor consume <code>POST /api/auth/login</code> y registro
          vendedor consume <code>POST /api/auth/register</code>.
        </p>
      </article>
    </section>
  )
}
