import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchVendorList } from '../../vendors/api/fetchVendorList'
import type { VendorListItem } from '../../vendors/vendor.types'
import './HomePage.css'

/** Cantidad maxima de tiendas a destacar en la portada. */
const FEATURED_LIMIT = 4

type FeaturedState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded'; vendors: VendorListItem[] }

/** Devuelve la primera imagen de producto disponible como logo de la tienda. */
const getStoreImage = (vendor: VendorListItem): string | null =>
  vendor.products.find((product) => product.image_url)?.image_url ?? null

/** Recorta la descripcion para la vista breve de la tarjeta. */
const toShortDescription = (description: string | null): string => {
  if (!description) return 'Esta tienda todavia no agrego una descripcion.'
  const trimmed = description.trim()
  return trimmed.length > 140 ? `${trimmed.slice(0, 140)}...` : trimmed
}

export function HomePage() {
  const [state, setState] = useState<FeaturedState>({ status: 'loading' })

  useEffect(() => {
    let cancelled = false

    fetchVendorList()
      .then((vendors) => {
        if (!cancelled) {
          setState({ status: 'loaded', vendors: vendors.slice(0, FEATURED_LIMIT) })
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ status: 'error' })
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="pa-root">
      {/* Header */}
      <header className="pa-header">
        <div className="pa-logo">
          Polos <em>Azules</em>
        </div>
        <div className="pa-badge">Centro Comercial</div>
      </header>

      {/* Hero */}
      <div className="pa-hero">
        <p className="pa-kicker">Directorio oficial · Temporada 2025</p>
        <h1 className="pa-h1">
          Un espacio<br />para <em>descubrir</em>
        </h1>
        <p className="pa-lead">
          Explora las tiendas del centro comercial, compara su puntuación y
          conoce rápidamente qué ofrece cada local.
        </p>

        <div className="pa-btn-row">
          <Link to="/tiendas" className="pa-btn pa-btn--primary">
            Ver tiendas
          </Link>
          <Link to="/auth/login" className="pa-btn pa-btn--secondary">
            Ingresar
          </Link>
          <a href="#stores" className="pa-btn pa-btn--ghost">
            Destacadas
          </a>
        </div>

        <hr className="pa-divider" />

        <div className="pa-metrics">
          <div className="pa-metric">
            <div className="pa-metric-val">
              {state.status === 'loaded' ? state.vendors.length : '—'}
            </div>
            <div className="pa-metric-lbl">Tiendas destacadas</div>
          </div>
          <div className="pa-metric">
            <div className="pa-metric-val">100%</div>
            <div className="pa-metric-lbl">Comercios locales</div>
          </div>
          <div className="pa-metric">
            <div className="pa-metric-val">★</div>
            <div className="pa-metric-lbl">Calidad certificada</div>
          </div>
        </div>
      </div>

      {/* Stores section */}
      <section id="stores">
        <div className="pa-section-head">
          <h2>Tiendas Destacadas</h2>
          <p>
            Conoce algunos de los locales del directorio y entra a la tienda que
            más te llame la atención.
          </p>
        </div>

        {state.status === 'loading' && (
          <p className="pa-status">Cargando tiendas...</p>
        )}

        {state.status === 'error' && (
          <p className="pa-status pa-status--error">
            No se pudieron cargar las tiendas. Intenta de nuevo más tarde.
          </p>
        )}

        {state.status === 'loaded' && state.vendors.length === 0 && (
          <p className="pa-status">
            Todavía no hay tiendas disponibles en el directorio.
          </p>
        )}

        {state.status === 'loaded' && state.vendors.length > 0 && (
          <div className="pa-grid">
            {state.vendors.map((vendor, index) => {
              const image = getStoreImage(vendor)

              return (
                <Link
                  className="pa-card"
                  to={`/tiendas/${vendor.vendor_id}`}
                  key={vendor.vendor_id}
                  aria-label={`Ver la tienda ${vendor.display_name}`}
                >
                  <span className="pa-card-num" aria-hidden="true">
                    {String(index + 1).padStart(2, '0')}
                  </span>

                  {image ? (
                    <img
                      className="pa-card-logo"
                      src={image}
                      alt={vendor.display_name}
                      loading="lazy"
                    />
                  ) : (
                    <div
                      className="pa-card-logo pa-card-logo--placeholder"
                      aria-hidden="true"
                    >
                      {vendor.display_name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <h3 className="pa-card-name">{vendor.display_name}</h3>
                  <p className="pa-desc">
                    {toShortDescription(vendor.description)}
                  </p>

                  <span className="pa-card-cta" aria-hidden="true">
                    Ver tienda →
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      <footer className="pa-footer">
        © 2025 Polos Azules · Todos los derechos reservados
      </footer>
    </div>
  )
}
