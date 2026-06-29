import { Navigate, useNavigate } from 'react-router-dom'
import { VendorRegisterForm } from '../components/VendorRegisterForm'
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

  const handleSuccess = async () => {
    const routeState: LoginRouteState = {
      registerMessage: 'Cuenta creada correctamente. Inicia sesion.',
    }

    await refreshSession()
    navigate('/auth/login', { state: routeState, replace: true })
  }

  return <VendorRegisterForm onSuccess={handleSuccess} />
}
