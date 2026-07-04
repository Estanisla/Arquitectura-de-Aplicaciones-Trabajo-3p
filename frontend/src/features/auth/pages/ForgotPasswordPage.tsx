import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../api/forgotPassword'

type FormStatus = 'idle' | 'loading' | 'sent' | 'error'

export function ForgotPasswordPage() {
  const [username, setUsername] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [message, setMessage] = useState('')
  const [devToken, setDevToken] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setStatus('loading')
    setDevToken(null)

    try {
      const result = await requestPasswordReset(username)
      setStatus('sent')
      setMessage(result.message)
      // Non-production backends surface the token so the flow can be
      // exercised without email delivery. Never rely on this in prod.
      if (result.token) {
        setDevToken(result.token)
      }
    } catch {
      setStatus('error')
      setMessage('No se pudo procesar la solicitud')
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Recuperar contrasena</h2>
      <p>
        Ingresa tu usuario. Si esta registrado, recibiras instrucciones para
        establecer una nueva contrasena.
      </p>

      <label className="field">
        <span>Usuario</span>
        <input
          type="text"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          autoComplete="username"
          required
        />
      </label>

      <button
        type="submit"
        className="button-link"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Enviando...' : 'Enviar instrucciones'}
      </button>

      {(status === 'sent' || status === 'error') && message && (
        <p
          className={
            status === 'error' ? 'feedback feedback--error' : 'feedback'
          }
        >
          {message}
        </p>
      )}

      {devToken && (
        <p className="feedback">
          Modo desarrollo — token temporal:{' '}
          <code>{devToken}</code>
          <br />
          <Link
            to={`/auth/reset-password?token=${encodeURIComponent(devToken)}`}
            className="inline-link"
          >
            Continuar al reset
          </Link>
        </p>
      )}

      <p className="auth-secondary-link">
        <Link to="/auth/login" className="inline-link">
          Volver al acceso
        </Link>
      </p>
    </form>
  )
}
