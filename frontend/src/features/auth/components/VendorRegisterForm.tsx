import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { registerVendor } from '../api/registerVendor'
import type { VendorRegisterResult } from '../types'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type FormStatus = 'idle' | 'loading' | 'error'

type VendorRegisterFormProps = {
  onSuccess: (result: VendorRegisterResult) => void | Promise<void>
}

const initialCredentials = {
  username: '',
  password: '',
  confirmPassword: '',
}

type FieldErrors = {
  username?: string
  password?: string
  confirmPassword?: string
}

export function VendorRegisterForm({ onSuccess }: VendorRegisterFormProps) {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})

  const updateField = (
    field: 'username' | 'password' | 'confirmPassword',
    value: string,
  ) => {
    setCredentials((prev) => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback('')

    const errors: FieldErrors = {}
    if (!credentials.username.trim()) errors.username = 'Este campo es obligatorio'
    if (!credentials.password.trim()) errors.password = 'Este campo es obligatorio'
    if (!credentials.confirmPassword.trim()) errors.confirmPassword = 'Este campo es obligatorio'

    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    if (credentials.password !== credentials.confirmPassword) {
      setStatus('error')
      setFeedback('Las contraseñas no coinciden')
      return
    }

    setStatus('loading')

    try {
      const result = await registerVendor({
        username: credentials.username,
        password: credentials.password,
      })

      if (!result.ok) {
        setStatus('error')
        setFeedback(DEFAULT_ERROR_MESSAGE)
        return
      }

      await onSuccess(result)
    } catch {
      setStatus('error')
      setFeedback(DEFAULT_ERROR_MESSAGE)
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
        />
        {fieldErrors.username && (
          <span className="field-error">{fieldErrors.username}</span>
        )}
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
        />
        {fieldErrors.password && (
          <span className="field-error">{fieldErrors.password}</span>
        )}
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
        />
        {fieldErrors.confirmPassword && (
          <span className="field-error">{fieldErrors.confirmPassword}</span>
        )}
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
