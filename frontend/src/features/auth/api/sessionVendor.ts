import { env } from '../../../shared/config/env'
import {
  DEFAULT_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'
import type { VendorSessionResult } from '../types'

const parseSessionResponse = async (
  response: Response,
): Promise<VendorSessionResult> => {
  return parseJsonResponse<VendorSessionResult>(response)
}

export const getVendorSession = async (): Promise<VendorSessionResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/session`, {
    method: 'GET',
    credentials: 'include',
  })

  const result = await parseSessionResponse(response)

  if (!response.ok && response.status >= 500) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return result
}

export const logoutVendor = async (): Promise<VendorSessionResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  const result = await parseSessionResponse(response)

  if (!response.ok && response.status >= 500) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return result
}
