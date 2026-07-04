import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchReviews } from '../api/fetchReviews'
import { removeReview } from '../api/removeReview'
import { ReviewModerationTable } from '../components/ReviewModerationTable'
import type {
  AdminReviewItem,
  ReviewModerationStatus,
} from '../reviewModeration.types'
import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_LOAD_ERROR_MESSAGE,
} from '../../../shared/errors/publicErrors'

type PageStatus = 'loading' | 'ready' | 'error'
type StatusFilter = ReviewModerationStatus | 'all'
type RatingFilter = 'all' | '1' | '2' | '3' | '4' | '5'
type ActionFeedback = { type: 'success' | 'error'; message: string } | null

export function AdminReviewsModerationPage() {
  const [reviews, setReviews] = useState<AdminReviewItem[]>([])
  const [status, setStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [feedback, setFeedback] = useState<ActionFeedback>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>('all')
  const [textFilter, setTextFilter] = useState('')

  const load = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchReviews()
      setReviews(data)
      setStatus('ready')
    } catch {
      setErrorMessage(DEFAULT_LOAD_ERROR_MESSAGE)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    // Initial fetch: setState inside is the intended data-loading path.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const handleRemove = async (reviewId: string) => {
    const confirmed = window.confirm(
      'Eliminar esta resena? Dejaremos de mostrarla publicamente.',
    )
    if (!confirmed) return

    try {
      setFeedback(null)
      await removeReview(reviewId)
      setFeedback({ type: 'success', message: 'Resena eliminada correctamente' })
      await load()
    } catch {
      setFeedback({ type: 'error', message: DEFAULT_ERROR_MESSAGE })
    }
  }

  const filteredReviews = useMemo(() => {
    const normalizedText = textFilter.trim().toLowerCase()
    return reviews.filter((review) => {
      if (statusFilter !== 'all' && review.status !== statusFilter) return false
      if (ratingFilter !== 'all' && review.rating !== Number(ratingFilter)) return false
      if (normalizedText) {
        const haystack =
          `${review.product_name} ${review.store_name} ${review.comment}`.toLowerCase()
        if (!haystack.includes(normalizedText)) return false
      }
      return true
    })
  }, [reviews, statusFilter, ratingFilter, textFilter])

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Moderacion de resenas</h2>
        <p>
          Vista dedicada para revisar y eliminar resenas reportadas o
          inapropiadas. Volver al{' '}
          <Link to="/admin" className="inline-link">
            panel principal
          </Link>
          .
        </p>
      </article>

      <article className="card">
        <div className="filter-grid">
          <label className="field">
            <span>Estado</span>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
            >
              <option value="all">Todas</option>
              <option value="visible">Visibles</option>
              <option value="removed">Eliminadas</option>
            </select>
          </label>
          <label className="field">
            <span>Calificacion</span>
            <select
              value={ratingFilter}
              onChange={(event) =>
                setRatingFilter(event.target.value as RatingFilter)
              }
            >
              <option value="all">Todas</option>
              <option value="1">1 estrella</option>
              <option value="2">2 estrellas</option>
              <option value="3">3 estrellas</option>
              <option value="4">4 estrellas</option>
              <option value="5">5 estrellas</option>
            </select>
          </label>
          <label className="field">
            <span>Buscar</span>
            <input
              type="search"
              value={textFilter}
              onChange={(event) => setTextFilter(event.target.value)}
              placeholder="Producto, tienda o comentario"
            />
          </label>
        </div>
      </article>

      <article className="card">
        {feedback && (
          <p className={`feedback feedback--${feedback.type}`}>{feedback.message}</p>
        )}
        {status === 'loading' && <p>Cargando resenas...</p>}
        {status === 'error' && (
          <>
            <p className="feedback feedback--error">{errorMessage}</p>
            <button type="button" className="button-link" onClick={load}>
              Reintentar
            </button>
          </>
        )}
        {status === 'ready' && (
          <>
            <p>
              {filteredReviews.length} / {reviews.length} resenas
            </p>
            <ReviewModerationTable
              reviews={filteredReviews}
              onRemove={handleRemove}
            />
          </>
        )}
      </article>
    </section>
  )
}
