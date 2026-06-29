import { useState } from 'react'
import type { FormEvent } from 'react'
import { changePassword } from '../api/changePassword'
import type { ChangePasswordResult } from '../types'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type FormStatus = 'idle' | 'loading' | 'error' | 'success'

type ChangePasswordFormProps = {
  onSuccess: (result: ChangePasswordResult) => void | Promise<void>
}

export function ChangePasswordForm({ onSuccess }: ChangePasswordFormProps) {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState('')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      setStatus('error')
      setFeedback('Las contrasenas no coinciden')
      return
    }

    if (newPassword.length < 6) {
      setStatus('error')
      setFeedback('La nueva contrasena debe tener al menos 6 caracteres')
      return
    }

    setStatus('loading')
    setFeedback('')

    try {
      const result = await changePassword({ currentPassword, newPassword })

      if (!result.ok) {
        setStatus('error')
        setFeedback(DEFAULT_ERROR_MESSAGE)
        return
      }

      await onSuccess(result)
      setStatus('success')
      setFeedback('Contrasena cambiada correctamente')
    } catch {
      setStatus('error')
      setFeedback(DEFAULT_ERROR_MESSAGE)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h2>Cambiar contrasena</h2>
      <p>Debes cambiar tu contrasena temporal antes de continuar.</p>

      <label className="field">
        <span>Contrasena actual</span>
        <input
          type="password"
          name="currentPassword"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          autoComplete="current-password"
          minLength={6}
          required
        />
      </label>

      <label className="field">
        <span>Nueva contrasena</span>
        <input
          type="password"
          name="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <label className="field">
        <span>Confirmar nueva contrasena</span>
        <input
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />
      </label>

      <button type="submit" className="button-link" disabled={status === 'loading'}>
        {status === 'loading' ? 'Cambiando...' : 'Cambiar contrasena'}
      </button>

      {feedback && (
        <p className={`feedback feedback--${status === 'error' ? 'error' : 'success'}`}>
          {feedback}
        </p>
      )}
    </form>
  )
}
