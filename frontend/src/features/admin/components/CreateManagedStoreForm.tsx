import { useState } from 'react'
import type { FormEvent } from 'react'
import { createManagedStore } from '../api/createManagedStore'
import type {
  CreateManagedStorePayload,
  StoreContactChannel,
  StoreMemberInput,
} from '../storeManagement.types'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type CreateManagedStoreFormProps = {
  currentEmporiumName: string | null
  onCreated: () => void
}

type ContactFields = Record<StoreContactChannel, string>
type FormStatus = 'idle' | 'loading' | 'error' | 'success'

const emptyContacts: ContactFields = {
  whatsapp: '',
  instagram: '',
  facebook: '',
  email: '',
  website: '',
}

const ownerMember = (): StoreMemberInput => ({
  username: '',
  tempPassword: '',
  role: 'owner',
})

export function CreateManagedStoreForm({
  currentEmporiumName,
  onCreated,
}: CreateManagedStoreFormProps) {
  const [emporiumName, setEmporiumName] = useState(currentEmporiumName ?? '')
  const [displayName, setDisplayName] = useState('')
  const [description, setDescription] = useState('')
  const [members, setMembers] = useState<StoreMemberInput[]>([ownerMember()])
  const [contacts, setContacts] = useState<ContactFields>(emptyContacts)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [feedback, setFeedback] = useState('')

  const updateMember = (
    index: number,
    field: 'username' | 'tempPassword',
    value: string,
  ) => {
    setMembers((current) =>
      current.map((member, position) =>
        position === index ? { ...member, [field]: value } : member,
      ),
    )
  }

  const addManager = () => {
    setMembers((current) => [
      ...current,
      { username: '', tempPassword: '', role: 'manager' },
    ])
  }

  const removeManager = (index: number) => {
    setMembers((current) =>
      current.filter((_member, position) => position !== index),
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedContacts = Object.entries(contacts)
      .filter(([, value]) => value.trim().length > 0)
      .map(([channel, value]) => ({
        channel: channel as StoreContactChannel,
        value: value.trim(),
      }))

    const payload: CreateManagedStorePayload = {
      emporiumName,
      displayName,
      description,
      members,
      contacts: normalizedContacts,
    }

    setStatus('loading')
    setFeedback('')
    try {
      await createManagedStore(payload)
      setStatus('success')
      setFeedback('Tienda y usuarios creados correctamente')
      setEmporiumName((current) => current.trim())
      setDisplayName('')
      setDescription('')
      setMembers([ownerMember()])
      setContacts(emptyContacts)
      onCreated()
    } catch {
      setStatus('error')
      setFeedback(DEFAULT_ERROR_MESSAGE)
    }
  }

  return (
    <form className="form-grid store-management-form" onSubmit={handleSubmit}>
      <h3>Crear tienda y usuarios administradores</h3>

      <label className="field">
        <span>Nombre del emporio</span>
        <input
          name="emporiumName"
          value={emporiumName}
          onChange={(event) => setEmporiumName(event.target.value)}
          minLength={2}
          disabled={Boolean(currentEmporiumName)}
          required
        />
      </label>

      <label className="field">
        <span>Nombre de la tienda</span>
        <input
          name="displayName"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          minLength={2}
          required
        />
      </label>

      <label className="field">
        <span>Descripcion</span>
        <textarea
          name="description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
        />
      </label>

      <fieldset className="form-subsection">
        <legend>Usuarios que administran la tienda</legend>
        {members.map((member, index) => (
          <div className="member-row" key={`${member.role}-${index}`}>
            <strong>
              {member.role === 'owner' ? 'Propietario' : `Administrador ${index}`}
            </strong>
            <label className="field">
              <span>Username</span>
              <input
                value={member.username}
                onChange={(event) =>
                  updateMember(index, 'username', event.target.value)
                }
                minLength={3}
                required
              />
            </label>
            <label className="field">
              <span>Contrasena temporal</span>
              <input
                type="text"
                value={member.tempPassword}
                onChange={(event) =>
                  updateMember(index, 'tempPassword', event.target.value)
                }
                minLength={6}
                required
              />
            </label>
            {member.role === 'manager' && (
              <button
                type="button"
                className="button-link button-link--danger"
                onClick={() => removeManager(index)}
              >
                Quitar usuario
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          className="button-link button-link--secondary"
          onClick={addManager}
        >
          Agregar otro usuario
        </button>
      </fieldset>

      <fieldset className="form-subsection">
        <legend>Canales directos de la tienda (opcionales)</legend>
        {(Object.keys(emptyContacts) as StoreContactChannel[]).map((channel) => (
          <label className="field" key={channel}>
            <span>{channel}</span>
            <input
              value={contacts[channel]}
              onChange={(event) =>
                setContacts((current) => ({
                  ...current,
                  [channel]: event.target.value,
                }))
              }
            />
          </label>
        ))}
      </fieldset>

      <button
        type="submit"
        className="button-link"
        disabled={status === 'loading'}
      >
        {status === 'loading' ? 'Creando...' : 'Crear tienda'}
      </button>

      {feedback && (
        <p className={`feedback feedback--${status === 'error' ? 'error' : 'success'}`}>
          {feedback}
        </p>
      )}
    </form>
  )
}
