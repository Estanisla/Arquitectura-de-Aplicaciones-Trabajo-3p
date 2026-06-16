import { describe, it, expect, vi, beforeEach } from 'vitest'

const { fetchVendorList } = await import('./fetchVendorList.ts')

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('fetchVendorList', () => {
  it('calls fetch with /api/vendors', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ vendors: [] }), { status: 200 }),
    )

    await fetchVendorList()

    expect(fetchMock).toHaveBeenCalledWith('/api/vendors')
  })

  it('returns vendor array when response is 200', async () => {
    const vendors = [
      {
        vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
        display_name: 'GrowaGarden',
        description: 'Plantas',
        products: [],
      },
    ]

    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ vendors }), { status: 200 }),
    )

    const result = await fetchVendorList()

    expect(result).toEqual(vendors)
  })

  it('throws when response is not ok', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(null, { status: 500 }),
    )

    await expect(fetchVendorList()).rejects.toThrow(
      'Error al cargar los vendedores',
    )
  })
})
