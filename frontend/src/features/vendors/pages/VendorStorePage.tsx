import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchVendorProfile } from '../api/fetchVendorProfile'
import { VendorProductGrid } from '../components/VendorProductGrid'
import { VendorContactLinks } from '../components/VendorContactLinks'
import type { VendorProfile } from '../vendor.types'
import './VendorStorePage.css'

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
    return (
      <div className="vendor-store-page vendor-store-page--status">
        <p className="vendor-store-page__status">Cargando tienda...</p>
      </div>
    )
  }

  if (state.type === 'error') {
    const message =
      state.message === 'Vendedor no encontrado'
        ? 'Esta tienda no existe.'
        : 'Error al cargar la tienda. Intenta de nuevo.'

    return (
      <div className="vendor-store-page vendor-store-page--status">
        <p className="vendor-store-page__status">{message}</p>
        <Link to="/tiendas" className="vendor-store-page__back">
          ← Volver a las tiendas
        </Link>
      </div>
    )
  }

  const { vendor } = state

  return (
    <div className="vendor-store-page">
      <Link to="/tiendas" className="vendor-store-page__back">
        ← Volver a las tiendas
      </Link>

      <header className="vendor-store-page__header">
        <p className="vendor-store-page__kicker">Tienda</p>
        <h1 className="vendor-store-page__title">{vendor.display_name}</h1>
        {vendor.description && (
          <p className="vendor-store-page__desc">{vendor.description}</p>
        )}
      </header>

      <VendorContactLinks contacts={vendor.contacts ?? []} />

      <section className="vendor-store-page__products">
        <h2 className="vendor-store-page__section-title">Productos</h2>
        <VendorProductGrid products={vendor.products} vendorId={vendor.vendor_id} />
      </section>
    </div>
  )
}
