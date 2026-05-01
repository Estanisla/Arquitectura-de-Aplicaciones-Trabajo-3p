import { useLocation } from 'react-router-dom'

type VendorRouteState = {
  loginMessage?: string
  userId?: string | null
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
    userId:
      typeof candidate.userId === 'string' || candidate.userId === null
        ? candidate.userId
        : undefined,
  }
}

export function VendorAreaPlaceholderPage() {
  const location = useLocation()
  const routeState = readRouteState(location.state)
  const persistedUserId = sessionStorage.getItem('vendor.user_id')
  const resolvedUserId = routeState.userId ?? persistedUserId
  const loginMessage = routeState.loginMessage ?? 'Acceso a placeholder vendedor'

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Area vendedor (placeholder)</h2>
        <p>{loginMessage}</p>
        <p>
          <strong>user_id:</strong> {resolvedUserId ?? 'no disponible'}
        </p>
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
