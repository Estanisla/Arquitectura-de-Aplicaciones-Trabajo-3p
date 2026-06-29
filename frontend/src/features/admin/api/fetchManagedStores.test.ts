import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchManagedStores } from './fetchManagedStores'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchManagedStores', () => {
  it('returns the managed store collection', async () => {
    const data = { emporium_name: 'Emporio Azul', stores: [] }
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchManagedStores()).resolves.toEqual(data)
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/admin/stores')
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include')
  })

  it('uses a generic error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: false }), { status: 500 }),
      ),
    )

    await expect(fetchManagedStores()).rejects.toThrow(
      'No se pudo cargar la informacion. Intenta nuevamente.',
    )
  })
})
