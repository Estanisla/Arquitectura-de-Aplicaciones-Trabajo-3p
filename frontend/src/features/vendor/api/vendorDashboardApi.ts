import { env } from '../../../shared/config/env'
import type {
  ManagedStoreSummary,
  ProductPayload,
  StoreContact,
  VendorReview,
  VendorStoreDashboard,
} from '../vendorDashboard.types'

type ApiResponse<T = undefined> = {
  ok: boolean
  data?: T
  productId?: string
}

async function request<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${env.API_BASE_URL}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!response.ok) throw new Error('No se pudo completar la solicitud')
  return (await response.json()) as ApiResponse<T>
}

export async function fetchManagedVendorStores(): Promise<
  ManagedStoreSummary[]
> {
  const result = await request<ManagedStoreSummary[]>('/api/vendor/stores')
  return result.data ?? []
}

export async function fetchVendorStoreDashboard(
  storeId: string,
): Promise<VendorStoreDashboard> {
  const result = await request<VendorStoreDashboard>(
    `/api/vendor/stores/${encodeURIComponent(storeId)}`,
  )
  if (!result.data) throw new Error('Tienda no disponible')
  return result.data
}

export async function updateVendorStoreProfile(
  storeId: string,
  displayName: string,
  description: string,
): Promise<void> {
  await request(`/api/vendor/stores/${encodeURIComponent(storeId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ displayName, description }),
  })
}

export async function updateVendorStoreContacts(
  storeId: string,
  contacts: StoreContact[],
): Promise<void> {
  await request(`/api/vendor/stores/${encodeURIComponent(storeId)}/contacts`, {
    method: 'PUT',
    body: JSON.stringify({ contacts }),
  })
}

export async function createVendorProduct(
  storeId: string,
  payload: ProductPayload,
): Promise<string> {
  const result = await request(
    `/api/vendor/stores/${encodeURIComponent(storeId)}/products`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
  if (!result.productId) throw new Error('No se pudo crear el producto')
  return result.productId
}

export async function updateVendorProduct(
  productId: string,
  payload: ProductPayload,
): Promise<void> {
  await request(`/api/vendor/products/${encodeURIComponent(productId)}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function removeVendorProduct(productId: string): Promise<void> {
  await request(`/api/vendor/products/${encodeURIComponent(productId)}`, {
    method: 'DELETE',
  })
}

export async function fetchVendorStoreReviews(
  storeId: string,
): Promise<VendorReview[]> {
  const result = await request<VendorReview[]>(
    `/api/vendor/stores/${encodeURIComponent(storeId)}/reviews`,
  )
  return result.data ?? []
}
