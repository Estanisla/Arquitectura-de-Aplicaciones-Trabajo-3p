import { env } from '../../../shared/config/env'

export type CreateVendorPayload = {
  username: string
  tempPassword: string
  displayName: string
  description?: string
}

export type CreateVendorResult = {
  ok: boolean
  message: string
  userId?: string
  vendorId?: string
}

export const createVendor = async (
  payload: CreateVendorPayload,
): Promise<CreateVendorResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/admin/vendors`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result: CreateVendorResult = await response.json()

  if (!response.ok && response.status >= 500) {
    throw new Error(result.message)
  }

  return result
}
