import { env } from '../../../shared/config/env'
import { DEFAULT_AUTH_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'
import type { VendorLoginRequest, VendorLoginResult } from '../types'
import { parseAuthResponse } from './parseAuthResponse'

export const loginVendor = async (
  payload: VendorLoginRequest,
): Promise<VendorLoginResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = (await parseAuthResponse(response, 'Login')) as VendorLoginResult

  if (!response.ok || !result.ok) {
    throw new Error(DEFAULT_AUTH_ERROR_MESSAGE)
  }

  return result
}
