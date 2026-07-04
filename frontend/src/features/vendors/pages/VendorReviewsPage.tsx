import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { fetchVendorProfile } from '../api/fetchVendorProfile'
import {
  fetchVendorReviews,
  type VendorReview,
} from '../api/fetchVendorReviews'
import { VendorReviewList } from '../components/VendorReviewList'

type PageState =
  | { type: 'loading' }
  | { type: 'error'; message: string }
  | { type: 'loaded'; storeName: string; reviews: VendorReview[] }

export function VendorReviewsPage() {
  const { vendorId } = useParams<{ vendorId: string }>()
  const [state, setState] = useState<PageState>({ type: 'loading' })

  useEffect(() => {
    if (!vendorId) return

    let cancelled = false

    Promise.all([fetchVendorProfile(vendorId), fetchVendorReviews(vendorId)])
      .then(([vendor, reviews]) => {
        if (!cancelled) {
          setState({
            type: 'loaded',
            storeName: vendor.display_name,
            reviews,
          })
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          const message =
            error instanceof Error ? error.message : 'Error desconocido'
          setState({ type: 'error', message })
        }
      })

    return () => {
      cancelled = true
    }
  }, [vendorId])

  if (state.type === 'loading') {
    return <p>Cargando resenas...</p>
  }

  if (state.type === 'error') {
    return (
      <section className="card-stack">
        <article className="card">
          <p>{state.message}</p>
          <Link to={`/tiendas/${vendorId ?? ''}`} className="inline-link">
            Volver a la tienda
          </Link>
        </article>
      </section>
    )
  }

  return (
    <section className="card-stack">
      <article className="card">
        <h1>Resenas de {state.storeName}</h1>
        <Link to={`/tiendas/${vendorId ?? ''}`} className="inline-link">
          Volver a la tienda
        </Link>
      </article>
      <article className="card">
        <VendorReviewList reviews={state.reviews} />
      </article>
    </section>
  )
}
