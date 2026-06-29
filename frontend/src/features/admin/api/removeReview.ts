import { env } from '../../../shared/config/env'
import {
  DEFAULT_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'

type RemoveReviewResult = {
  ok: boolean
}

export const removeReview = async (reviewId: string): Promise<void> => {
  const response = await fetch(
    `${env.API_BASE_URL}/api/admin/reviews/${reviewId}`,
    {
      method: 'DELETE',
      credentials: 'include',
    },
  )
  const result = await parseJsonResponse<RemoveReviewResult>(response)

  if (!response.ok || !result.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }
}
