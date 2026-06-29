import { env } from '../../../shared/config/env'
import {
  DEFAULT_LOAD_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'
import type { AdminReviewItem } from '../reviewModeration.types'

type FetchReviewsResult = {
  ok: boolean
  data?: AdminReviewItem[]
}

export const fetchReviews = async (): Promise<AdminReviewItem[]> => {
  const response = await fetch(`${env.API_BASE_URL}/api/admin/reviews`, {
    method: 'GET',
    credentials: 'include',
  })
  const result = await parseJsonResponse<FetchReviewsResult>(response)

  if (!response.ok || !result.ok) {
    throw new Error(DEFAULT_LOAD_ERROR_MESSAGE)
  }

  return result.data ?? []
}
