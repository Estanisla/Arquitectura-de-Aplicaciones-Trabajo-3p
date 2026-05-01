import { useNavigate } from 'react-router-dom'
import { VendorLoginForm } from '../components/VendorLoginForm'
import type { VendorLoginResult } from '../types'

type VendorRouteState = {
  loginMessage: string
  userId: string | null
}

export function VendorLoginPage() {
  const navigate = useNavigate()

  const handleSuccess = (result: VendorLoginResult) => {
    const routeState: VendorRouteState = {
      loginMessage: result.message,
      userId: result.user_id ?? null,
    }

    navigate('/vendor', { state: routeState })
  }

  return <VendorLoginForm onSuccess={handleSuccess} />
}
