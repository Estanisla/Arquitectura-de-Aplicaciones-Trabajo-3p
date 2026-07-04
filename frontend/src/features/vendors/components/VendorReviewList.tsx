import type { VendorReview } from '../api/fetchVendorReviews'

type VendorReviewListProps = {
  reviews: VendorReview[]
}

const formatDate = (isoDate: string): string => {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleDateString()
}

const renderStars = (rating: number): string => {
  const filled = Math.max(0, Math.min(5, Math.round(rating)))
  return '★'.repeat(filled) + '☆'.repeat(5 - filled)
}

export function VendorReviewList({ reviews }: VendorReviewListProps) {
  if (reviews.length === 0) {
    return <p>Esta tienda aun no tiene resenas publicadas.</p>
  }

  const average =
    reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length

  return (
    <div className="vendor-review-list">
      <p>
        <strong>{renderStars(average)}</strong> ({average.toFixed(1)} de 5 en{' '}
        {reviews.length} resenas)
      </p>
      <ul className="vendor-review-list__items">
        {reviews.map((review) => (
          <li key={review.id} className="vendor-review-list__item">
            <header>
              <strong>{review.product_name}</strong>
              <span>{renderStars(review.rating)}</span>
              <time dateTime={review.created_at}>
                {formatDate(review.created_at)}
              </time>
            </header>
            <p>{review.comment}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
