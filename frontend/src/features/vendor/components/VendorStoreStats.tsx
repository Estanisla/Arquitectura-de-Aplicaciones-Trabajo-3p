import { useState } from 'react'
import type { VendorProduct, VendorReview } from '../vendorDashboard.types'

type VendorStoreStatsProps = {
  products: VendorProduct[]
  reviews: VendorReview[]
}

const DAY_MS = 1000 * 60 * 60 * 24

const countReviewsSince = (reviews: VendorReview[], sinceMs: number): number =>
  reviews.filter((review) => {
    const parsed = new Date(review.created_at).getTime()
    return Number.isFinite(parsed) && parsed >= sinceMs
  }).length

export function VendorStoreStats({ products, reviews }: VendorStoreStatsProps) {
  const visibleProducts = products.filter((product) => product.is_visible).length
  const totalReviews = reviews.length
  const averageRating =
    totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0

  // Capture "now" on mount so the render stays pure; the stats are a
  // rough summary and a page reload is enough to refresh the window.
  const [now] = useState(() => Date.now())
  const last7Days = countReviewsSince(reviews, now - 7 * DAY_MS)
  const last30Days = countReviewsSince(reviews, now - 30 * DAY_MS)

  return (
    <div className="vendor-store-stats">
      <h3>Resumen de la tienda</h3>
      <dl className="vendor-store-stats__grid">
        <div>
          <dt>Productos visibles</dt>
          <dd>{visibleProducts} / {products.length}</dd>
        </div>
        <div>
          <dt>Resenas recibidas</dt>
          <dd>{totalReviews}</dd>
        </div>
        <div>
          <dt>Rating promedio</dt>
          <dd>
            {totalReviews > 0 ? `${averageRating.toFixed(1)} / 5` : 'Sin datos'}
          </dd>
        </div>
        <div>
          <dt>Resenas ultimos 7 dias</dt>
          <dd>{last7Days}</dd>
        </div>
        <div>
          <dt>Resenas ultimos 30 dias</dt>
          <dd>{last30Days}</dd>
        </div>
      </dl>
    </div>
  )
}
