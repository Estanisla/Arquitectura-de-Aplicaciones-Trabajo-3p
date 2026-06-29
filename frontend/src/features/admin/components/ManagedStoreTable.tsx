import { useState } from 'react'
import type { FormEvent } from 'react'
import { addStoreMember } from '../api/addStoreMember'
import { setStoreMemberActive } from '../api/setStoreMemberActive'
import { updateStoreContacts } from '../api/updateStoreContacts'
import type {
  ManagedStore,
  StoreContactChannel,
} from '../storeManagement.types'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type ManagedStoreTableProps = {
  stores: ManagedStore[]
  onChanged: () => void
}

const roleLabel = {
  owner: 'Propietario',
  manager: 'Administrador',
} as const

const channels: StoreContactChannel[] = [
  'whatsapp',
  'instagram',
  'facebook',
  'email',
  'website',
]

export function ManagedStoreTable({
  stores,
  onChanged,
}: ManagedStoreTableProps) {
  const [username, setUsername] = useState('')
  const [tempPassword, setTempPassword] = useState('')
  const [editingStore, setEditingStore] = useState<string | null>(null)
  const [contacts, setContacts] = useState<Record<StoreContactChannel, string>>({
    whatsapp: '',
    instagram: '',
    facebook: '',
    email: '',
    website: '',
  })
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  if (stores.length === 0) {
    return <p className="feedback">El emporio aun no tiene tiendas.</p>
  }

  const beginContacts = (store: ManagedStore) => {
    const values = {
      whatsapp: '',
      instagram: '',
      facebook: '',
      email: '',
      website: '',
    }
    for (const contact of store.contacts) values[contact.channel] = contact.value
    setContacts(values)
    setEditingStore(store.store_id)
    setFeedback('')
  }

  const handleAddMember = async (
    event: FormEvent<HTMLFormElement>,
    storeId: string,
  ) => {
    event.preventDefault()
    setBusy(true)
    setFeedback('')
    try {
      await addStoreMember(storeId, username, tempPassword)
      setUsername('')
      setTempPassword('')
      setFeedback('Usuario agregado correctamente')
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  const handleMemberStatus = async (
    storeId: string,
    memberUsername: string,
    isActive: boolean,
  ) => {
    setBusy(true)
    setFeedback('')
    try {
      await setStoreMemberActive(storeId, memberUsername, isActive)
      setFeedback('Usuario actualizado correctamente')
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  const handleContacts = async (storeId: string) => {
    setBusy(true)
    setFeedback('')
    try {
      await updateStoreContacts(
        storeId,
        channels
          .filter((channel) => contacts[channel].trim())
          .map((channel) => ({ channel, value: contacts[channel].trim() })),
      )
      setFeedback('Contactos actualizados correctamente')
      setEditingStore(null)
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="admin-table-wrapper">
      {feedback && <p className="feedback">{feedback}</p>}
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tienda</th>
            <th>Usuarios administradores</th>
            <th>Contactos</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          {stores.map((store) => (
            <tr key={store.store_id}>
              <td>
                <strong>{store.display_name}</strong>
                {store.description && <p>{store.description}</p>}
              </td>
              <td>
                <ul className="compact-list">
                  {store.members.map((member) => (
                    <li key={member.username}>
                      {member.username} ({roleLabel[member.role]}) —{' '}
                      {member.is_active ? 'Activo' : 'Inactivo'}
                      {member.must_change_password && ' — cambio de clave pendiente'}
                      {member.role === 'manager' && (
                        <button
                          type="button"
                          className="button-link button-link--secondary button-link--compact"
                          disabled={busy}
                          onClick={() =>
                            void handleMemberStatus(
                              store.store_id,
                              member.username,
                              !member.is_active,
                            )
                          }
                        >
                          {member.is_active ? 'Desactivar' : 'Activar'}
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
                <form
                  className="inline-management-form"
                  onSubmit={(event) => void handleAddMember(event, store.store_id)}
                >
                  <input
                    aria-label={`Nuevo usuario para ${store.display_name}`}
                    placeholder="Nuevo usuario"
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    minLength={3}
                    required
                  />
                  <input
                    aria-label={`Clave temporal para ${store.display_name}`}
                    placeholder="Clave temporal"
                    value={tempPassword}
                    onChange={(event) => setTempPassword(event.target.value)}
                    minLength={6}
                    required
                  />
                  <button className="button-link button-link--compact" disabled={busy}>
                    Agregar
                  </button>
                </form>
              </td>
              <td>
                {editingStore === store.store_id ? (
                  <div className="contact-editor">
                    {channels.map((channel) => (
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
                    <button
                      type="button"
                      className="button-link button-link--compact"
                      disabled={busy}
                      onClick={() => void handleContacts(store.store_id)}
                    >
                      Guardar contactos
                    </button>
                  </div>
                ) : (
                  <>
                    {store.contacts.length > 0 ? (
                      <ul className="compact-list">
                        {store.contacts.map((contact) => (
                          <li key={contact.channel}>
                            {contact.channel}: {contact.value}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="feedback">Sin contactos</span>
                    )}
                    <button
                      type="button"
                      className="button-link button-link--secondary button-link--compact"
                      onClick={() => beginContacts(store)}
                    >
                      Editar
                    </button>
                  </>
                )}
              </td>
              <td>{store.is_active ? 'Activa' : 'Inactiva'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
