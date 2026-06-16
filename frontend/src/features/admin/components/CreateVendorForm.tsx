import { useState } from 'react'
import type { FormEvent } from 'react'
import { createVendor } from '../api/createVendor'
import type { CreateVendorPayload } from '../api/createVendor'

type FormStatus = 'idle' | 'loading' | 'error' | 'success'

type CreateVendorFormProps = {
  onCreated: () => void
}

export function CreateVendorForm({ onCreated }: CreateVendorFormProps) {
  const [fields, setFields] = useState<CreateVendorPayload>({
    username: '',
    tempPassword: '',
    displayName: '',
    description: '',
  })
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState('')
  const [tempPasswordDisplay, setTempPasswordDisplay] = useState('')

  const updateField = (field: keyof CreateVendorPayload, value: string) => {
    setFields((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (fields.username.length < 3) {
      setStatus('error')
      setFeedback('El username debe tener al menos 3 caracteres')
      return
    }

    if (fields.tempPassword.length < 6) {
      setStatus('error')
      setFeedback('La contrasena temporal debe tener al menos 6 caracteres')
      return
    }

    if (fields.displayName.length < 2) {
      setStatus('error')
      setFeedback('El nombre de tienda debe tener al menos 2 caracteres')
      return
    }

    setStatus('loading')
    setFeedback('')
    setTempPasswordDisplay('')

    try {
      const result = await createVendor(fields)

      if (!result.ok) {
        setStatus('error')
        setFeedback(result.message)
        return
      }

      setStatus('success')
      setTempPasswordDisplay(fields.tempPassword)
      setFeedback('Vendedor creado correctamente')
      setFields({ username: '', tempPassword: '', displayName: '', description: '' })

      if (result.userId && result.vendorId) {
        onCreated()
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error inesperado'
      setStatus('error')
      setFeedback(message)
    }
  }

  return (
    <form className="card form-grid" onSubmit={handleSubmit}>
      <h3>Crear nuevo vendedor</h3>

      <label className="field">
        <span>Username</span>
        <input
          type="text"
          name="username"
          value={fields.username}
          onChange={(e) => updateField('username', e.target.value)}
          autoComplete="off"
          minLength={3}
          required
        />
      </label>

      <label className="field">
        <span>Contrasena temporal</span>
        <input
          type="text"
          name="tempPassword"
          value={fields.tempPassword}
          onChange={(e) => updateField('tempPassword', e.target.value)}
          autoComplete="off"
          minLength={6}
          required
        />
      </label>

      <label className="field">
        <span>Nombre de tienda</span>
        <input
          type="text"
          name="displayName"
          value={fields.displayName}
          onChange={(e) => updateField('displayName', e.target.value)}
          autoComplete="off"
          minLength={2}
          required
        />
      </label>

      <label className="field">
        <span>Descripcion (opcional)</span>
        <textarea
          name="description"
          value={fields.description ?? ''}
          onChange={(e) => updateField('description', e.target.value)}
          rows={3}
        />
      </label>

      <button type="submit" className="button-link" disabled={status === 'loading'}>
        {status === 'loading' ? 'Creando...' : 'Crear vendedor'}
      </button>

      {tempPasswordDisplay && (
        <div className="feedback feedback--warning">
          <p>
            <strong>Contrasena temporal (muestrela al vendedor):</strong>
          </p>
          <code className="temp-password">{tempPasswordDisplay}</code>
          <p>Esta contrasena no se mostrara nuevamente.</p>
        </div>
      )}

      {feedback && (
        <p className={`feedback feedback--${status === 'error' ? 'error' : 'success'}`}>
          {feedback}
        </p>
      )}
    </form>
  )
}
