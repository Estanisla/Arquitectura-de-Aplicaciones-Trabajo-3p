import type { VendorProfile } from '../vendor.types'

export async function fetchVendorProfile(vendorId: string): Promise<VendorProfile> {
  const response = await fetch(`/api/vendors/${vendorId}`)
  if (response.status === 404) throw new Error('Vendedor no encontrado')
  if (response.status === 400) throw new Error('ID de vendedor invalido')
  if (!response.ok) throw new Error('Error al cargar la tienda')
  const body = await response.json()
  return body.vendor as VendorProfile
}
