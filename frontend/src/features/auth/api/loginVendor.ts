import { env } from '../../../shared/config/env'
import type { VendorLoginRequest, VendorLoginResult } from '../types'

const parseLoginResponse = async (
  response: Response,
): Promise<VendorLoginResult> => {
  const rawBody = await response.text()

  if (!rawBody) {
    throw new Error(`Login response without body (status ${response.status})`)
  }

  try {
    return JSON.parse(rawBody) as VendorLoginResult
  } catch {
    throw new Error(`Login response invalid JSON (status ${response.status})`)
  }
}

export const loginVendor = async (
  payload: VendorLoginRequest,
): Promise<VendorLoginResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = await parseLoginResponse(response)

  if (!response.ok && response.status >= 500) {
    throw new Error(result.message)
  }

  return result
}
