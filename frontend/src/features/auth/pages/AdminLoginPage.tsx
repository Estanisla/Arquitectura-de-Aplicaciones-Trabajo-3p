import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { loginAdmin } from '../api/loginAdmin'
import { useAuthSession } from '../session/useAuthSession'
import { DEFAULT_AUTH_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

const initialCredentials = {
  username: '',
  password: '',
}

export function AdminLoginPage() {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [feedback, setFeedback] = useState('')
  const {
    refreshSession,
    status,
    isAuthenticated,
    role,
  } = useAuthSession()

  if (status !== 'loading' && isAuthenticated && role === 'admin') {
    return <Navigate to="/admin" replace />
  }

  const updateField = (field: 'username' | 'password', value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    try {
      setFeedback('')
      const result = await loginAdmin(credentials)

      if (!result.ok) {
        setFeedback(DEFAULT_AUTH_ERROR_MESSAGE)
        return
      }

      await refreshSession()
    } catch {
      setFeedback(DEFAULT_AUTH_ERROR_MESSAGE)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Login company-admin</h2>
      <p>
        Este acceso es independiente del flujo vendedor. El registro de admin no
        se realiza desde la landing publica.
      </p>

      <label className="field">
        <span>Usuario admin</span>
        <input
          type="text"
          name="username"
          value={credentials.username}
          onChange={(event) => updateField('username', event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <label className="field">
        <span>Password</span>
        <input
          type="password"
          name="password"
          value={credentials.password}
          onChange={(event) => updateField('password', event.target.value)}
          autoComplete="current-password"
          minLength={10}
          required
        />
      </label>

      <button type="submit" className="button-link">
        Ingresar como admin
      </button>

      {feedback && <p className="feedback">{feedback}</p>}

      <p className="auth-secondary-link">
        <Link to="/auth/login" className="inline-link">
          Volver al acceso de vendedor
        </Link>
      </p>
    </form>
  )
}
