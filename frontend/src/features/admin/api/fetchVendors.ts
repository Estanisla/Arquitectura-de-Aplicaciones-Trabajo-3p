import { env } from '../../../shared/config/env'

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

  const result: FetchVendorsResult = await response.json()

  if (!response.ok) {
    throw new Error(result.message ?? 'Error al obtener vendedores')
  }

  return result.vendors ?? []
}
