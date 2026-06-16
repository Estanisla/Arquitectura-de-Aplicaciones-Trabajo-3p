import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { fetchVendorProfile } from '../api/fetchVendorProfile'
import { VendorProductGrid } from '../components/VendorProductGrid'
import type { VendorProfile } from '../vendor.types'

type PageState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'loaded'; vendor: VendorProfile }

export function VendorStorePage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const [state, setState] = useState<PageState>({ type: 'loading' })

  useEffect(() => {
    if (!vendorId) return

    let cancelled = false

    fetchVendorProfile(vendorId)
      .then((vendor) => {
        if (!cancelled) {
          setState({ type: 'loaded', vendor })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : 'Error desconocido'
          setState({ type: 'error', message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [vendorId])

  if (state.type === 'loading') {
    return <p>Cargando tienda...</p>
  }

  if (state.type === 'error') {
    if (state.message === 'Vendedor no encontrado') {
      return <p>Esta tienda no existe.</p>
    }
    return <p>Error al cargar la tienda. Intenta de nuevo.</p>
  }

  const { vendor } = state

  return (
    <div className="vendor-store-page">
      <h1>{vendor.display_name}</h1>
      {vendor.description && <p>{vendor.description}</p>}
      <VendorProductGrid products={vendor.products} />
    </div>
  )
}
