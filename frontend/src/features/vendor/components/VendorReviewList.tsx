import type { VendorReview } from '../vendorDashboard.types'

export function VendorReviewList({ reviews }: { reviews: VendorReview[] }) {
  if (reviews.length === 0) {
    return <p className="feedback">La tienda aun no tiene resenas visibles.</p>
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Calificacion</th>
            <th>Comentario</th>
            <th>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>{review.product_name}</td>
              <td>{review.rating} / 5</td>
              <td>{review.comment}</td>
              <td>{new Date(review.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
