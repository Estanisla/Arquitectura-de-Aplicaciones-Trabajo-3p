import type { AdminReviewItem } from '../reviewModeration.types'

type ReviewModerationTableProps = {
  reviews: AdminReviewItem[]
  onRemove: (reviewId: string) => void
}

export function ReviewModerationTable({
  reviews,
  onRemove,
}: ReviewModerationTableProps) {
  if (reviews.length === 0) {
    return <p className="feedback">No hay resenas para moderar.</p>
  }

  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Tienda</th>
            <th>Comentario</th>
            <th>Calificacion</th>
            <th>Fecha</th>
            <th>Estado</th>
            <th>Accion</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map((review) => (
            <tr key={review.id}>
              <td>{review.product_name}</td>
              <td>{review.store_name}</td>
              <td className="admin-table__comment">{review.comment}</td>
              <td>{review.rating} / 5</td>
              <td>{new Date(review.created_at).toLocaleDateString()}</td>
              <td>{review.status === 'removed' ? 'Eliminada' : 'Visible'}</td>
              <td>
                {review.status === 'visible' ? (
                  <button
                    type="button"
                    className="button-link button-link--danger"
                    onClick={() => onRemove(review.id)}
                  >
                    Eliminar
                  </button>
                ) : (
                  <span className="feedback">Sin acciones</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
