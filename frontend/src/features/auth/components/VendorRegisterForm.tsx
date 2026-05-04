import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { registerVendor } from '../api/registerVendor'
import type { VendorRegisterResult } from '../types'

type FormStatus = 'idle' | 'loading' | 'error'

type VendorRegisterFormProps = {
  onSuccess: (result: VendorRegisterResult) => void | Promise<void>
}

const initialCredentials = {
  username: '',
  password: '',
  confirmPassword: '',
}

export function VendorRegisterForm({ onSuccess }: VendorRegisterFormProps) {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState('')

  const updateField = (
    field: 'username' | 'password' | 'confirmPassword',
    value: string,
  ) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (credentials.password !== credentials.confirmPassword) {
      setStatus('error')
      setFeedback('Las contraseñas no coinciden')
      return
    }

    setStatus('loading')
    setFeedback('')

    try {
      const result = await registerVendor({
        username: credentials.username,
        password: credentials.password,
      })

      if (!result.ok) {
        setStatus('error')
        setFeedback(result.message)
        return
      }

      await onSuccess(result)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado en registro'
      setStatus('error')
      setFeedback(message)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Create account (vendedor)</h2>

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
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <label className="field">
        <span>Confirmar password</span>
        <input
          type="password"
          name="confirmPassword"
          value={credentials.confirmPassword}
          onChange={(event) => updateField('confirmPassword', event.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <button type="submit" className="button-link" disabled={status === 'loading'}>
        {status === 'loading' ? 'Creando cuenta...' : 'Crear cuenta'}
      </button>

      {feedback && (
        <p className={status === 'error' ? 'feedback feedback--error' : 'feedback'}>
          {feedback}
        </p>
      )}

      <p className="auth-secondary-link">
        ¿Ya tienes cuenta?{' '}
        <Link to="/auth/login" className="inline-link">
          Ir a login
        </Link>
      </p>
    </form>
  )
}
