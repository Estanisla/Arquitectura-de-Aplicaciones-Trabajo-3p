import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { VendorLoginForm } from '../components/VendorLoginForm'
import type { VendorLoginResult } from '../types'
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
    return <Navigate to="/vendor" replace />
  }

  const handleSuccess = async (result: VendorLoginResult) => {
    await refreshSession()

    if (result.must_change_password) {
      navigate('/auth/change-password', { replace: true })
      return
    }

    navigate('/vendor', { replace: true })
  }

  return (
    <VendorLoginForm
      onSuccess={handleSuccess}
      initialFeedback={routeState.registerMessage}
    />
  )
}
