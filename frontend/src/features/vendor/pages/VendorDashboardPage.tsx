import { useCallback, useEffect, useState } from 'react'
import {
  fetchManagedVendorStores,
  fetchVendorStoreDashboard,
  fetchVendorStoreReviews,
} from '../api/vendorDashboardApi'
import { VendorProductManager } from '../components/VendorProductManager'
import { VendorReviewList } from '../components/VendorReviewList'
import { VendorStoreSettings } from '../components/VendorStoreSettings'
import type {
  ManagedStoreSummary,
  VendorReview,
  VendorStoreDashboard,
} from '../vendorDashboard.types'
import { DEFAULT_LOAD_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type Status = 'loading' | 'ready' | 'error'

export function VendorDashboardPage() {
  const [stores, setStores] = useState<ManagedStoreSummary[]>([])
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [store, setStore] = useState<VendorStoreDashboard | null>(null)
  const [reviews, setReviews] = useState<VendorReview[]>([])
  const [status, setStatus] = useState<Status>('loading')
  const [feedback, setFeedback] = useState('')

  const loadStore = useCallback(async (storeId: string) => {
    try {
      const [storeData, reviewData] = await Promise.all([
        fetchVendorStoreDashboard(storeId),
        fetchVendorStoreReviews(storeId),
      ])
      setStore(storeData)
      setReviews(reviewData)
      setStatus('ready')
    } catch {
      setFeedback(DEFAULT_LOAD_ERROR_MESSAGE)
      setStatus('error')
    }
  }, [])

  const loadStores = useCallback(async () => {
    setStatus('loading')
    try {
      const data = await fetchManagedVendorStores()
      setStores(data)
      const nextStoreId = selectedStoreId || data[0]?.store_id || ''
      setSelectedStoreId(nextStoreId)
      if (nextStoreId) {
        await loadStore(nextStoreId)
      } else {
        setStore(null)
        setReviews([])
        setStatus('ready')
      }
    } catch {
      setFeedback(DEFAULT_LOAD_ERROR_MESSAGE)
      setStatus('error')
    }
  }, [loadStore, selectedStoreId])

  useEffect(() => {
    let active = true
    fetchManagedVendorStores()
      .then(async (data) => {
        if (!active) return
        setStores(data)
        const firstStoreId = data[0]?.store_id ?? ''
        setSelectedStoreId(firstStoreId)
        if (!firstStoreId) {
          setStatus('ready')
          return
        }
        const [storeData, reviewData] = await Promise.all([
          fetchVendorStoreDashboard(firstStoreId),
          fetchVendorStoreReviews(firstStoreId),
        ])
        if (!active) return
        setStore(storeData)
        setReviews(reviewData)
        setStatus('ready')
      })
      .catch(() => {
        if (!active) return
        setFeedback(DEFAULT_LOAD_ERROR_MESSAGE)
        setStatus('error')
      })
    return () => {
      active = false
    }
  }, [])

  const selectStore = (storeId: string) => {
    setSelectedStoreId(storeId)
    setStatus('loading')
    void loadStore(storeId)
  }

  if (status === 'loading') {
    return <section className="card"><p>Cargando area de tienda...</p></section>
  }

  if (status === 'error') {
    return (
      <section className="card">
        <p className="feedback feedback--error">{feedback}</p>
        <button className="button-link" onClick={() => void loadStores()}>
          Reintentar
        </button>
      </section>
    )
  }

  if (!store) {
    return (
      <section className="card">
        <h2>Area de tienda</h2>
        <p>No tienes una tienda activa asignada. Solicita acceso al administrador.</p>
      </section>
    )
  }

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Administrar {store.display_name}</h2>
        <p>
          Rol en la tienda:{' '}
          {store.member_role === 'owner' ? 'Propietario' : 'Administrador'}
        </p>
        {stores.length > 1 && (
          <label className="field vendor-store-selector">
            <span>Tienda</span>
            <select
              value={selectedStoreId}
              onChange={(event) => selectStore(event.target.value)}
            >
              {stores.map((item) => (
                <option key={item.store_id} value={item.store_id}>
                  {item.display_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </article>
      <article className="card">
        <VendorStoreSettings
          key={store.store_id}
          store={store}
          onChanged={() => void loadStore(store.store_id)}
        />
      </article>
      <article className="card">
        <VendorProductManager
          storeId={store.store_id}
          products={store.products}
          onChanged={() => void loadStore(store.store_id)}
        />
      </article>
      <article className="card">
        <h3>Resenas de la tienda ({reviews.length})</h3>
        <VendorReviewList reviews={reviews} />
      </article>
    </section>
  )
}
