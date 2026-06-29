import { env } from '../../../shared/config/env'
import {
  DEFAULT_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'

export type DeactivateVendorResult = {
  ok: boolean
  message: string
}

export const deactivateVendor = async (
  vendorId: string,
): Promise<DeactivateVendorResult> => {
  const response = await fetch(
    `${env.API_BASE_URL}/api/admin/vendors/${vendorId}/deactivate`,
    {
      method: 'PATCH',
      credentials: 'include',
    },
  )

  const result = await parseJsonResponse<DeactivateVendorResult>(response)

  if (!response.ok || !result.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return result
}
