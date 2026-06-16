import { describe, it, expect, vi, beforeEach } from 'vitest'

const { fetchVendorProfile } = await import('./fetchVendorProfile.ts')

const validUuid = 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchVendorProfile', () => {
  it('calls fetch with /api/vendors/<vendorId>', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ vendor: { vendor_id: validUuid, display_name: 'Test', products: [] } }), { status: 200 }),
    )

    await fetchVendorProfile(validUuid)

    expect(globalThis.fetch).toHaveBeenCalledWith(`/api/vendors/${validUuid}`)
  })

  it('returns profile when response is 200', async () => {
    const profile = {
      vendor_id: validUuid,
      display_name: 'GrowaGarden',
      description: 'Plantas',
      products: [],
    }

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ vendor: profile }), { status: 200 }),
    )

    const result = await fetchVendorProfile(validUuid)

    expect(result).toEqual(profile)
  })

  it('throws "Vendedor no encontrado" on 404', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 404 }),
    )

    await expect(fetchVendorProfile(validUuid)).rejects.toThrow(
      'Vendedor no encontrado',
    )
  })

  it('throws "ID de vendedor invalido" on 400', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 400 }),
    )

    await expect(fetchVendorProfile('bad-id')).rejects.toThrow(
      'ID de vendedor invalido',
    )
  })

  it('throws generic error for other non-ok statuses', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 503 }),
    )

    await expect(fetchVendorProfile(validUuid)).rejects.toThrow(
      'Error al cargar la tienda',
    )
  })
})
