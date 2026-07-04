import { env } from '../../../shared/config/env'
import {
  DEFAULT_LOAD_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'

export type VendorReview = {
  id: string
  product_id: string
  vendor_id: string
  product_name: string
  rating: number
  comment: string
  created_at: string
}

type FetchVendorReviewsResponse = {
  ok: boolean
  data?: VendorReview[]
  message?: string
}

export const fetchVendorReviews = async (
  vendorId: string,
): Promise<VendorReview[]> => {
  const response = await fetch(
    `${env.API_BASE_URL}/api/vendors/${encodeURIComponent(vendorId)}/reviews`,
    { method: 'GET' },
  )

  const result = await parseJsonResponse<FetchVendorReviewsResponse>(response)

  if (!response.ok) {
    throw new Error(result.message ?? DEFAULT_LOAD_ERROR_MESSAGE)
  }

  return result.data ?? []
}
