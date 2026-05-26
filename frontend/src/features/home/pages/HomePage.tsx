import { Link } from 'react-router-dom'
import './HomePage.css'

type Store = {
  name: string
  category: string
  rating: number
  description: string
}

const stores: Store[] = [
  {
    name: 'Moda Marina',
    category: 'Ropa casual y de playa',
    rating: 5,
    description:
      'Prendas frescas, conjuntos para escapadas de fin de semana y accesorios para un estilo relajado junto al mar.',
  },
  {
    name: 'Sabores del Atrio',
    category: 'Gastronomía y café',
    rating: 4,
    description:
      'Bebidas artesanales, repostería y opciones para almuerzos rápidos dentro del centro comercial.',
  },
  {
    name: 'Tecnología Azul',
    category: 'Accesorios y gadgets',
    rating: 5,
    description:
      'Audífonos, cargadores, fundas y pequeños dispositivos para el día a día con soporte personalizado.',
  },
  {
    name: 'Hogar Costero',
    category: 'Decoración y regalos',
    rating: 4,
    description:
      'Artículos decorativos, sets para el hogar y detalles para regalar en cualquier ocasión especial.',
  },
]

const renderStars = (rating: number) =>
  Array.from({ length: 5 }, (_, index) => index < rating)

export function HomePage() {
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
          <Link to="/auth/login" className="pa-btn pa-btn--primary">
            Ingresar
          </Link>
          <a href="#stores" className="pa-btn pa-btn--secondary">
            Ver tiendas
          </a>
        </div>

        <hr className="pa-divider" />

        <div className="pa-metrics">
          <div className="pa-metric">
            <div className="pa-metric-val">4.5</div>
            <div className="pa-metric-lbl">Puntuación general</div>
          </div>
          <div className="pa-metric">
            <div className="pa-metric-val">4</div>
            <div className="pa-metric-lbl">Tiendas destacadas</div>
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
            Revisa cada local con su calificación y una vista breve de lo que
            ofrecen.
          </p>
        </div>

        <div className="pa-grid">
          {stores.map((store, index) => (
            <article className="pa-card" key={store.name}>
              <span className="pa-card-num" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <p className="pa-cat">{store.category}</p>
              <h3 className="pa-card-name">{store.name}</h3>

              <div
                className="pa-stars"
                aria-label={`Calificación ${store.rating} de 5`}
              >
                {renderStars(store.rating).map((isFilled, i) => (
                  <span
                    key={`${store.name}-${i}`}
                    className={`pa-star ${isFilled ? 'pa-star--filled' : 'pa-star--empty'}`}
                    aria-hidden="true"
                  >
                    {isFilled ? '★' : '☆'}
                  </span>
                ))}
                <span className="pa-rating-txt">{store.rating}.0 / 5</span>
              </div>

              <p className="pa-desc">{store.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="pa-footer">
        © 2025 Plos Azules · Todos los derechos reservados
      </footer>
    </div>
  )
}