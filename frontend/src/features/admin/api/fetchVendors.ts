import { env } from '../../../shared/config/env'
import {
  DEFAULT_LOAD_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'

export type AdminVendorItem = {
  user_id: string
  username: string
  display_name: string
  vendor_id: string
  is_active: boolean
  is_deleted: boolean
  must_change_password: boolean
  created_at: string
}

export type FetchVendorsResult = {
  ok: boolean
  vendors?: AdminVendorItem[]
  message?: string
}

export const fetchVendors = async (): Promise<AdminVendorItem[]> => {
  const response = await fetch(`${env.API_BASE_URL}/api/admin/vendors`, {
    method: 'GET',
    credentials: 'include',
  })

  const result = await parseJsonResponse<FetchVendorsResult>(response)

  if (!response.ok) {
    throw new Error(DEFAULT_LOAD_ERROR_MESSAGE)
  }

  return result.vendors ?? []
}
