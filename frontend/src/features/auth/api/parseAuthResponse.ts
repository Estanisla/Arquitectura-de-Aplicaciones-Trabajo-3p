import type { VendorAuthResult } from '../types'

export const parseAuthResponse = async (
  response: Response,
  context: 'Login' | 'Register',
): Promise<VendorAuthResult> => {
  const rawBody = await response.text()

  if (!rawBody) {
    throw new Error(`${context} response without body (status ${response.status})`)
  }

  try {
    return JSON.parse(rawBody) as VendorAuthResult
  } catch {
    throw new Error(`${context} response invalid JSON (status ${response.status})`)
  }
}
