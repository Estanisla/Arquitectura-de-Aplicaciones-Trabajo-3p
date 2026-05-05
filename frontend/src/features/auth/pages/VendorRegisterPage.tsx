import { Navigate, useNavigate } from 'react-router-dom'
import { VendorRegisterForm } from '../components/VendorRegisterForm'
import type { VendorRegisterResult } from '../types'
import { useAuthSession } from '../session/useAuthSession'

type LoginRouteState = {
  registerMessage: string
}

export function VendorRegisterPage() {
  const navigate = useNavigate()
  const { refreshSession, status, isAuthenticated } = useAuthSession()

  if (status !== 'loading' && isAuthenticated) {
    return <Navigate to="/profile" replace />
  }

  const handleSuccess = async (result: VendorRegisterResult) => {
    const routeState: LoginRouteState = {
      registerMessage: result.message,
    }

    await refreshSession()
    navigate('/auth/login', { state: routeState, replace: true })
  }

  return <VendorRegisterForm onSuccess={handleSuccess} />
}
