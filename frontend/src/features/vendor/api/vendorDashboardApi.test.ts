import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createVendorProduct,
  fetchManagedVendorStores,
  fetchVendorStoreDashboard,
  fetchVendorStoreReviews,
  removeVendorProduct,
  updateVendorProduct,
  updateVendorStoreContacts,
  updateVendorStoreProfile,
} from './vendorDashboardApi'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('vendorDashboardApi', () => {
  it('loads stores and performs authenticated writes', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          ok: true,
          data: [{
            store_id: 'store-1',
            display_name: 'Tienda',
            member_role: 'owner',
          }],
        }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          ok: true,
          data: {
            store_id: 'store-1',
            display_name: 'Tienda',
            description: null,
            is_active: true,
            member_role: 'owner',
            products: [],
            contacts: [],
          },
        }), { status: 200 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({
          ok: true,
          productId: 'product-1',
        }), { status: 201 }),
      )
      .mockImplementation(
        async () => new Response(JSON.stringify({ ok: true }), { status: 200 }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchManagedVendorStores()).resolves.toHaveLength(1)
    await expect(
      fetchVendorStoreDashboard('store-1'),
    ).resolves.toMatchObject({ display_name: 'Tienda' })
    await expect(
      createVendorProduct('store-1', { name: 'Producto' }),
    ).resolves.toBe('product-1')
    await updateVendorStoreProfile('store-1', 'Tienda nueva', 'Descripcion')
    await updateVendorStoreContacts('store-1', [{
      channel: 'email',
      value: 'demo@example.com',
    }])
    await updateVendorProduct('product-1', {
      name: 'Producto',
      isVisible: false,
    })
    await removeVendorProduct('product-1')
    await expect(fetchVendorStoreReviews('store-1')).resolves.toEqual([])

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include')
    expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('POST')
    expect(fetchMock.mock.calls[6]?.[1]?.method).toBe('DELETE')
  })

  it('does not expose response error details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('postgres://private-host', { status: 500 }),
      ),
    )
    await expect(fetchManagedVendorStores()).rejects.toThrow(
      'No se pudo completar la solicitud',
    )
  })
})
