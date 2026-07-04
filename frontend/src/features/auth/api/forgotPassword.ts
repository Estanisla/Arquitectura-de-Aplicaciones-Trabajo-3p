import { env } from '../../../shared/config/env'
import { parseJsonResponse } from '../../../shared/errors/publicErrors'

type ForgotPasswordResponse = {
  ok: boolean
  message: string
  token?: string
  expires_at?: string
}

export const requestPasswordReset = async (
  username: string,
): Promise<ForgotPasswordResponse> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  })

  return parseJsonResponse<ForgotPasswordResponse>(response)
}

export const completePasswordReset = async (
  token: string,
  newPassword: string,
): Promise<{ ok: boolean; message: string }> => {
  const response = await fetch(`${env.API_BASE_URL}/api/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  })

  return parseJsonResponse<{ ok: boolean; message: string }>(response)
}
