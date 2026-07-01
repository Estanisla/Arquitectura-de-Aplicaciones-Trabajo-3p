import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  updateVendorStoreContacts,
  updateVendorStoreProfile,
} from '../api/vendorDashboardApi'
import type {
  StoreContactChannel,
  VendorStoreDashboard,
} from '../vendorDashboard.types'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type Props = {
  store: VendorStoreDashboard
  onChanged: () => void
}

const channels: StoreContactChannel[] = [
  'whatsapp',
  'instagram',
  'facebook',
  'email',
  'website',
]

export function VendorStoreSettings({ store, onChanged }: Props) {
  const [displayName, setDisplayName] = useState(store.display_name)
  const [description, setDescription] = useState(store.description ?? '')
  const [contacts, setContacts] = useState<Record<StoreContactChannel, string>>(
    () => {
      const initial = {
        whatsapp: '',
        instagram: '',
        facebook: '',
        email: '',
        website: '',
      }
      for (const contact of store.contacts) initial[contact.channel] = contact.value
      return initial
    },
  )
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  const updateProfile = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setFeedback('')
    try {
      await updateVendorStoreProfile(store.store_id, displayName, description)
      setFeedback('Datos de la tienda actualizados')
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  const updateContacts = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setFeedback('')
    try {
      await updateVendorStoreContacts(
        store.store_id,
        channels
          .filter((channel) => contacts[channel].trim())
          .map((channel) => ({ channel, value: contacts[channel].trim() })),
      )
      setFeedback('Canales de contacto actualizados')
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="vendor-settings-grid">
      <form className="form-grid" onSubmit={(event) => void updateProfile(event)}>
        <h3>Perfil de la tienda</h3>
        <label className="field">
          <span>Nombre</span>
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            minLength={2}
            required
          />
        </label>
        <label className="field">
          <span>Descripcion</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <button className="button-link" disabled={busy}>
          Guardar perfil
        </button>
      </form>
      <form className="form-grid" onSubmit={(event) => void updateContacts(event)}>
        <h3>Contacto directo</h3>
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
        <button className="button-link" disabled={busy}>
          Guardar contactos
        </button>
      </form>
      {feedback && <p className="feedback">{feedback}</p>}
    </div>
  )
}
