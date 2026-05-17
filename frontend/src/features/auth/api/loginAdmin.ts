import { env } from '../../../shared/config/env'
import type { VendorLoginRequest, VendorLoginResult } from '../types'
import { parseAuthResponse } from './parseAuthResponse'

export const loginAdmin = async (
  payload: VendorLoginRequest,
): Promise<VendorLoginResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/admin/login`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = (await parseAuthResponse(response, 'Login')) as VendorLoginResult

  if (!response.ok && response.status >= 500) {
    throw new Error(result.message)
  }

  return result
}
