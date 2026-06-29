import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import {
  createProductReview,
  fetchProductReviews,
} from '../api/productReviewsApi'
import type { PublicReview } from '../review.types'

type Props = {
  productId: string
  vendorId: string
}

type Status = 'loading' | 'ready' | 'error'

export function ProductReviews({ productId, vendorId }: Props) {
  const [reviews, setReviews] = useState<PublicReview[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState('')

  const loadReviews = useCallback(async () => {
    try {
      setReviews(await fetchProductReviews(productId))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [productId])

  useEffect(() => {
    let active = true
    fetchProductReviews(productId)
      .then((data) => {
        if (active) {
          setReviews(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [productId])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitting(true)
    setFeedback('')
    try {
      await createProductReview(productId, vendorId, rating, comment)
      setComment('')
      setRating(5)
      setFeedback('Resena publicada correctamente')
      await loadReviews()
    } catch {
      setFeedback('No se pudo publicar la resena')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="product-reviews" aria-label="Resenas del producto">
      <h5>Resenas ({reviews.length})</h5>
      {status === 'loading' && <p>Cargando resenas...</p>}
      {status === 'error' && (
        <button
          type="button"
          className="button-link button-link--secondary button-link--compact"
          onClick={() => void loadReviews()}
        >
          Reintentar
        </button>
      )}
      {status === 'ready' && reviews.length === 0 && (
        <p className="feedback">Se el primero en dejar una resena.</p>
      )}
      {status === 'ready' && reviews.length > 0 && (
        <ul className="review-list">
          {reviews.map((review) => (
            <li key={review.id}>
              <strong>{review.rating} / 5</strong> — {review.comment}
            </li>
          ))}
        </ul>
      )}
      <form className="review-form" onSubmit={(event) => void submit(event)}>
        <label className="field">
          <span>Calificacion</span>
          <select
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
          >
            {[5, 4, 3, 2, 1].map((value) => (
              <option value={value} key={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Comentario</span>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            maxLength={1000}
            required
          />
        </label>
        <button
          className="button-link button-link--compact"
          disabled={submitting}
        >
          {submitting ? 'Publicando...' : 'Publicar resena'}
        </button>
      </form>
      {feedback && <p className="feedback">{feedback}</p>}
    </section>
  )
}
