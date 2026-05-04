import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { VendorLoginForm } from '../components/VendorLoginForm'
import { useAuthSession } from '../session/useAuthSession'

type LoginRouteState = {
  registerMessage?: string
}

const readRouteState = (value: unknown): LoginRouteState => {
  if (!value || typeof value !== 'object') {
    return {}
  }

  const candidate = value as Record<string, unknown>
  return {
    registerMessage:
      typeof candidate.registerMessage === 'string'
        ? candidate.registerMessage
        : undefined,
  }
}

export function VendorLoginPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { refreshSession, status, isAuthenticated } = useAuthSession()
  const routeState = readRouteState(location.state)

  if (status !== 'loading' && isAuthenticated) {
    return <Navigate to="/profile" replace />
  }

  const handleSuccess = async () => {
    await refreshSession()
    navigate('/profile', { replace: true })
  }

  return (
    <VendorLoginForm
      onSuccess={handleSuccess}
      initialFeedback={routeState.registerMessage}
    />
  )
}
