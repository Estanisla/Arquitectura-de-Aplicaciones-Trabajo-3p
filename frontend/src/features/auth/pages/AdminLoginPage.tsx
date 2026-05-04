import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'

const initialCredentials = {
  username: '',
  password: '',
}

export function AdminLoginPage() {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [feedback, setFeedback] = useState('')

  const updateField = (field: 'username' | 'password', value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(
      'Login company-admin separado activo en UI. Integracion backend admin pendiente.',
    )
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
          minLength={6}
          required
        />
      </label>

      <button type="submit" className="button-link">
        Ingresar como admin
      </button>

      {feedback && <p className="feedback">{feedback}</p>}

      <p className="auth-secondary-link">
        Volver al acceso vendedor:{' '}
        <Link to="/auth/login" className="inline-link">
          /auth/login
        </Link>
      </p>
    </form>
  )
}
