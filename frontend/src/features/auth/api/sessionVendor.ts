import { env } from '../../../shared/config/env'
import type { VendorSessionResult } from '../types'

const parseSessionResponse = async (
  response: Response,
): Promise<VendorSessionResult> => {
  const rawBody = await response.text()

  if (!rawBody) {
    throw new Error(`Session response without body (status ${response.status})`)
  }

  try {
    return JSON.parse(rawBody) as VendorSessionResult
  } catch {
    throw new Error(`Session response invalid JSON (status ${response.status})`)
  }
}

export const getVendorSession = async (): Promise<VendorSessionResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/session`, {
    method: 'GET',
    credentials: 'include',
  })

  const result = await parseSessionResponse(response)

  if (!response.ok && response.status >= 500) {
    throw new Error(result.message)
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
    throw new Error(result.message)
  }

  return result
}
