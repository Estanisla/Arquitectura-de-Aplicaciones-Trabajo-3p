import { env } from '../../../shared/config/env'
import {
  DEFAULT_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'
import type { CreateManagedStorePayload } from '../storeManagement.types'

type CreateManagedStoreResponse = {
  ok: boolean
  message: string
  storeId?: string
  emporiumName?: string
}

export const createManagedStore = async (
  payload: CreateManagedStorePayload,
): Promise<CreateManagedStoreResponse> => {
  const response = await fetch(`${env.API_BASE_URL}/api/admin/stores`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const result = await parseJsonResponse<CreateManagedStoreResponse>(response)

  if (!response.ok || !result.ok) {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }

  return result
}
