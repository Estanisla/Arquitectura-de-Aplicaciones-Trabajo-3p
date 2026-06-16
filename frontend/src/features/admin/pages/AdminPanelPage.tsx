import { useCallback, useEffect, useState } from 'react'
import { fetchVendors } from '../api/fetchVendors'
import type { AdminVendorItem } from '../api/fetchVendors'
import { VendorTable } from '../components/VendorTable'
import { CreateVendorForm } from '../components/CreateVendorForm'
import { deactivateVendor } from '../api/deactivateVendor'

type PageStatus = 'loading' | 'ready' | 'error'

export function AdminPanelPage() {
  const [vendors, setVendors] = useState<AdminVendorItem[]>([])
  const [status, setStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [actionFeedback, setActionFeedback] = useState('')

  const loadVendors = useCallback(async () => {
    try {
      const data = await fetchVendors()
      setVendors(data)
      setStatus('ready')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar vendedores'
      setErrorMessage(message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await loadVendors()
    }
    void init()
  }, [loadVendors])

  const handleDeactivate = async (vendorId: string) => {
    const vendor = vendors.find((v) => v.vendor_id === vendorId)
    if (!vendor) return

    const confirmed = window.confirm(
      `Desactivar la tienda "${vendor.display_name}"?`,
    )
    if (!confirmed) return

    try {
      setActionFeedback('')
      const result = await deactivateVendor(vendorId)
      if (!result.ok) {
        setActionFeedback(result.message)
        return
      }
      setActionFeedback('Tienda desactivada correctamente')
      await loadVendors()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al desactivar'
      setActionFeedback(message)
    }
  }

  if (status === 'loading') {
    return (
      <section className="card-stack">
        <article className="card">
          <p>Cargando panel de administracion...</p>
        </article>
      </section>
    )
  }

  if (status === 'error') {
    return (
      <section className="card-stack">
        <article className="card">
          <h2>Error</h2>
          <p className="feedback feedback--error">{errorMessage}</p>
          <button className="button-link" onClick={loadVendors}>
            Reintentar
          </button>
        </article>
      </section>
    )
  }

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Panel company-admin</h2>
        <p>Gestion de vendedores y tiendas.</p>
      </article>
      <article className="card">
        <CreateVendorForm onCreated={loadVendors} />
      </article>
      <article className="card">
        <h3>Vendedores registrados ({vendors.length})</h3>
        {actionFeedback && (
          <p className="feedback feedback--success">{actionFeedback}</p>
        )}
        <VendorTable vendors={vendors} onDeactivate={handleDeactivate} />
      </article>
    </section>
  )
}