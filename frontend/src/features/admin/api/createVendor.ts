import { env } from '../../../shared/config/env'
import {
  DEFAULT_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'

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

  const result = await parseJsonResponse<CreateVendorResult>(response)

  if (!response.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return {
    ...result,
    ok: true,
    message: 'Vendedor creado correctamente',
  }
}
