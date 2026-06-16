import { env } from '../../../shared/config/env'

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

  const result: DeactivateVendorResult = await response.json()

  if (!response.ok && response.status >= 500) {
    throw new Error(result.message)
  }

  return result
}
