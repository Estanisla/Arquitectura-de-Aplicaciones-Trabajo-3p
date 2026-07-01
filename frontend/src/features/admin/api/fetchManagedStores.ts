import { env } from '../../../shared/config/env'
import {
  DEFAULT_LOAD_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'
import type { ManagedStoreCollection } from '../storeManagement.types'

type FetchManagedStoresResponse = {
  ok: boolean
  data?: ManagedStoreCollection
}

export const fetchManagedStores = async (): Promise<ManagedStoreCollection> => {
  const response = await fetch(`${env.API_BASE_URL}/api/admin/stores`, {
    method: 'GET',
    credentials: 'include',
  })
  const result = await parseJsonResponse<FetchManagedStoresResponse>(response)

  if (!response.ok || !result.ok || !result.data) {
    throw new Error(DEFAULT_LOAD_ERROR_MESSAGE)
  }

  return result.data
}
