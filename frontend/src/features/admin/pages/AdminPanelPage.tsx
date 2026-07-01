import { useCallback, useEffect, useState } from 'react'
import { fetchReviews } from '../api/fetchReviews'
import { removeReview } from '../api/removeReview'
import { ReviewModerationTable } from '../components/ReviewModerationTable'
import type { AdminReviewItem } from '../reviewModeration.types'
import { fetchManagedStores } from '../api/fetchManagedStores'
import type { ManagedStoreCollection } from '../storeManagement.types'
import { CreateManagedStoreForm } from '../components/CreateManagedStoreForm'
import { ManagedStoreTable } from '../components/ManagedStoreTable'
import {
  DEFAULT_ERROR_MESSAGE,
  DEFAULT_LOAD_ERROR_MESSAGE,
} from '../../../shared/errors/publicErrors'

type PageStatus = 'loading' | 'ready' | 'error'
type ReviewStatus = 'loading' | 'ready' | 'error'
type ActionFeedback = {
  type: 'success' | 'error'
  message: string
} | null

export function AdminPanelPage() {
  const [managedStores, setManagedStores] = useState<ManagedStoreCollection>({
    emporium_name: null,
    stores: [],
  })
  const [status, setStatus] = useState<PageStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [reviews, setReviews] = useState<AdminReviewItem[]>([])
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('loading')
  const [reviewFeedback, setReviewFeedback] = useState<ActionFeedback>(null)

  const loadStores = useCallback(async () => {
    try {
      const data = await fetchManagedStores()
      setManagedStores(data)
      setStatus('ready')
    } catch {
      setErrorMessage(DEFAULT_LOAD_ERROR_MESSAGE)
      setStatus('error')
    }
  }, [])

  const loadReviews = useCallback(async () => {
    try {
      const data = await fetchReviews()
      setReviews(data)
      setReviewStatus('ready')
    } catch {
      setReviewFeedback({
        type: 'error',
        message: DEFAULT_LOAD_ERROR_MESSAGE,
      })
      setReviewStatus('error')
    }
  }, [])

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadStores(), loadReviews()])
    }
    void init()
  }, [loadReviews, loadStores])

  const handleRemoveReview = async (reviewId: string) => {
    const confirmed = window.confirm(
      'Eliminar esta resena? Dejaremos de mostrarla publicamente.',
    )
    if (!confirmed) return

    try {
      setReviewFeedback(null)
      await removeReview(reviewId)
      setReviewFeedback({
        type: 'success',
        message: 'Resena eliminada correctamente',
      })
      await loadReviews()
    } catch {
      setReviewFeedback({ type: 'error', message: DEFAULT_ERROR_MESSAGE })
    }
  }

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Panel company-admin</h2>
        <p>Gestion del emporio, tiendas, usuarios y moderacion.</p>
      </article>
      {status === 'loading' && (
        <article className="card">
          <p>Cargando panel de administracion...</p>
        </article>
      )}
      {status === 'error' && (
        <article className="card">
          <h3>Gestion de tiendas no disponible</h3>
          <p className="feedback feedback--error">{errorMessage}</p>
          <button type="button" className="button-link" onClick={loadStores}>
            Reintentar
          </button>
        </article>
      )}
      {status === 'ready' && (
        <>
          <article className="card">
            <CreateManagedStoreForm
              currentEmporiumName={managedStores.emporium_name}
              onCreated={loadStores}
            />
          </article>
          <article className="card">
            <h3>
              {managedStores.emporium_name ?? 'Emporio sin configurar'}: tiendas
              ({managedStores.stores.length})
            </h3>
            <ManagedStoreTable
              stores={managedStores.stores}
              onChanged={loadStores}
            />
          </article>
        </>
      )}
      <article className="card">
        <h3>Moderacion de resenas ({reviews.length})</h3>
        {reviewFeedback && (
          <p className={`feedback feedback--${reviewFeedback.type}`}>
            {reviewFeedback.message}
          </p>
        )}
        {reviewStatus === 'loading' && <p>Cargando resenas...</p>}
        {reviewStatus === 'error' && (
          <button type="button" className="button-link" onClick={loadReviews}>
            Reintentar
          </button>
        )}
        {reviewStatus === 'ready' && (
          <ReviewModerationTable
            reviews={reviews}
            onRemove={handleRemoveReview}
          />
        )}
      </article>
    </section>
  )
}
