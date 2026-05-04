import { useLocation } from 'react-router-dom'

type VendorRouteState = {
  loginMessage?: string
}

const readRouteState = (value: unknown): VendorRouteState => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const candidate = value as Record<string, unknown>
  return {
    loginMessage:
      typeof candidate.loginMessage === 'string'
        ? candidate.loginMessage
        : undefined,
  }
}

export function VendorAreaPlaceholderPage() {
  const location = useLocation()
  const routeState = readRouteState(location.state)
  const loginMessage = routeState.loginMessage ?? 'Acceso a placeholder vendedor'

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Area vendedor (placeholder)</h2>
        <p>{loginMessage}</p>
      </article>
      <article className="card">
        <p>
          En siguientes pasos aqui ira gestion de productos, seccion de perfil y
          herramientas operativas de vendedor.
        </p>
      </article>
    </section>
  )
}
