import { env } from '../../../shared/config/env'
import type { PublicReview } from '../review.types'

type ReviewListResponse = { ok: boolean; data?: PublicReview[] }
type ReviewCreateResponse = { ok: boolean; data?: PublicReview }

export async function fetchProductReviews(
  productId: string,
): Promise<PublicReview[]> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/products/${encodeURIComponent(productId)}/reviews`,
  )
  if (!response.ok) throw new Error('No se pudieron cargar las resenas')
  const result = (await response.json()) as ReviewListResponse
  return result.data ?? []
}

export async function createProductReview(
  productId: string,
  vendorId: string,
  rating: number,
  comment: string,
): Promise<PublicReview> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/products/${encodeURIComponent(productId)}/reviews`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vendor_id: vendorId, rating, comment }),
    },
  )
  if (!response.ok) throw new Error('No se pudo publicar la resena')
  const result = (await response.json()) as ReviewCreateResponse
  if (!result.data) throw new Error('No se pudo publicar la resena')
  return result.data
}
