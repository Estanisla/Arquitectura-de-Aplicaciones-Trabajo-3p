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
  const [showPassword, setShowPassword] = useState(false)

  const updateField = (field: 'username' | 'password', value: string) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
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
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={credentials.password}
            onChange={(event) => updateField('password', event.target.value)}
            autoComplete="current-password"
            minLength={6}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              display: 'flex',
              color: '#666',
            }}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </label>

      <button type="submit" className="button-link" disabled={status === 'loading'}>
        {status === 'loading' ? 'Validando...' : 'Ingresar'}
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

function EyeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx={12} cy={12} r={3} />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1={1} y1={1} x2={23} y2={23} />
    </svg>
  )
}
