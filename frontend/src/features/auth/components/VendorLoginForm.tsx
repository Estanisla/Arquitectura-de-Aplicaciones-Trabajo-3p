import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { loginVendor } from '../api/loginVendor'
import type { VendorLoginResult } from '../types'
import { DEFAULT_AUTH_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type FormStatus = 'idle' | 'loading' | 'error'

type VendorLoginFormProps = {
  onSuccess: (result: VendorLoginResult) => void | Promise<void>
  initialFeedback?: string
}

const initialCredentials = {
  username: '',
  password: '',
}

export function VendorLoginForm({
  onSuccess,
  initialFeedback = '',
}: VendorLoginFormProps) {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState(initialFeedback)

  const updateField = (field: 'username' | 'password', value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
  }

  const handleClear = () => {
    setCredentials(initialCredentials)
    setStatus('idle')
    setFeedback('')
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setFeedback('')

    try {
      const result = await loginVendor(credentials)

      if (!result.ok) {
        setStatus('error')
        setFeedback(DEFAULT_AUTH_ERROR_MESSAGE)
        return
      }

      await onSuccess(result)
      setStatus('idle')
      setFeedback('')
    } catch {
      setStatus('error')
      setFeedback(DEFAULT_AUTH_ERROR_MESSAGE)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Login vendedor</h2>

      <label className="field">
        <span>Usuario</span>
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

      <button type="submit" className="button-link" disabled={status === 'loading'}>
        {status === 'loading' ? 'Validando...' : 'Ingresar'}
      </button>

      <button type="button" className="button-link button-link--secondary" onClick={handleClear} disabled={status === 'loading'}>
        Limpiar
      </button>

      {feedback && (
        <p className={status === 'error' ? 'feedback feedback--error' : 'feedback'}>
          {feedback}
        </p>
      )}

      <p className="auth-secondary-link">
        <Link to="/auth/lg-admin" className="inline-link">
          Acceso de administrador
        </Link>
      </p>
    </form>
  )
}
