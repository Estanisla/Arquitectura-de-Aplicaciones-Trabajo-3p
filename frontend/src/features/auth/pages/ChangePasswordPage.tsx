import { useNavigate } from 'react-router-dom'
import { ChangePasswordForm } from '../components/ChangePasswordForm'
import { useAuthSession } from '../session/useAuthSession'

export function ChangePasswordPage() {
  const navigate = useNavigate()
  const { refreshSession } = useAuthSession()

  const handleSuccess = async () => {
    await refreshSession()
    navigate('/vendor', { replace: true })
  }

  return <ChangePasswordForm onSuccess={handleSuccess} />
}
