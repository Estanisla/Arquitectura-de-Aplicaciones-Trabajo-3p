import { env } from '../../../shared/config/env'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'
import type { VendorRegisterRequest, VendorRegisterResult } from '../types'
import { parseAuthResponse } from './parseAuthResponse'

export const registerVendor = async (
  payload: VendorRegisterRequest,
): Promise<VendorRegisterResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/register`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const result = (await parseAuthResponse(
    response,
    'Register',
  )) as VendorRegisterResult

  if (!response.ok || !result.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return result
}
