import { useState } from 'react'
import type { FormEvent } from 'react'
import { loginVendor } from '../api/loginVendor'
import type { VendorLoginResult } from '../types'

type FormStatus = 'idle' | 'loading' | 'error'

type VendorLoginFormProps = {
  onSuccess: (result: VendorLoginResult) => void
}

const initialCredentials = {
  username: '',
  password: '',
}

export function VendorLoginForm({ onSuccess }: VendorLoginFormProps) {
  const [credentials, setCredentials] = useState(initialCredentials)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState('')

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
        setFeedback(result.message)
        return
      }

      if (result.user_id) {
        sessionStorage.setItem('vendor.user_id', result.user_id)
      } else {
        sessionStorage.removeItem('vendor.user_id')
      }

      onSuccess(result)
      setStatus('idle')
      setFeedback('')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado en login'
      setStatus('error')
      setFeedback(message)
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

      {feedback && (
        <p className={status === 'error' ? 'feedback feedback--error' : 'feedback'}>
          {feedback}
        </p>
      )}
    </form>
  )
}
