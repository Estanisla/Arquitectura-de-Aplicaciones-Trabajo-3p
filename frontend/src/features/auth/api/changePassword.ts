import { env } from '../../../shared/config/env'
import {
  DEFAULT_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'
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

  const result = await parseJsonResponse<ChangePasswordResult>(response)

  if (!response.ok || !result.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return result
}
