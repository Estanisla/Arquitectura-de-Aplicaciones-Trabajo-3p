import type { VendorListItem } from '../vendor.types'

export async function fetchVendorList(): Promise<VendorListItem[]> {
  const response = await fetch('/api/vendors')
  if (!response.ok) throw new Error('Error al cargar los vendedores')
  const body = await response.json()
  return body.vendors as VendorListItem[]
}
