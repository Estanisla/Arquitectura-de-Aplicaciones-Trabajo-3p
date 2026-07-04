import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { completePasswordReset } from '../api/forgotPassword'

type FormStatus = 'idle' | 'loading' | 'error'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialToken = searchParams.get('token') ?? ''

  const [token, setToken] = useState(initialToken)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setErrorMessage('')

    if (newPassword !== confirmPassword) {
      setErrorMessage('Las contrasenas no coinciden')
      setStatus('error')
      return
    }

    setStatus('loading')

    try {
      const result = await completePasswordReset(token, newPassword)
      if (!result.ok) {
        setStatus('error')
        setErrorMessage(result.message)
        return
      }
      navigate('/auth/login', {
        replace: true,
        state: { registerMessage: 'Contrasena actualizada, ya puedes ingresar' },
      })
    } catch {
      setStatus('error')
      setErrorMessage('No se pudo cambiar la contrasena')
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Establecer nueva contrasena</h2>

      <label className="field">
        <span>Token recibido</span>
        <input
          type="text"
          value={token}
          onChange={(event) => setToken(event.target.value)}
          required
          minLength={32}
        />
      </label>

      <label className="field">
        <span>Nueva contrasena</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <label className="field">
        <span>Confirmar contrasena</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <button
        type="submit"
        className="button-link"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Guardando...' : 'Guardar contrasena'}
      </button>

      {status === 'error' && errorMessage && (
        <p className="feedback feedback--error">{errorMessage}</p>
      )}

      <p className="auth-secondary-link">
        <Link to="/auth/forgot-password" className="inline-link">
          Solicitar un nuevo token
        </Link>
      </p>
    </form>
  )
}
