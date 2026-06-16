import { env } from '../../../shared/config/env'
import type { ChangePasswordRequest, ChangePasswordResult } from '../types'

export const changePassword = async (
  payload: ChangePasswordRequest,
): Promise<ChangePasswordResult> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/change-password`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  const result: ChangePasswordResult = await response.json()

  if (!response.ok && response.status >= 500) {
    throw new Error(result.message)
  }

  return result
}
