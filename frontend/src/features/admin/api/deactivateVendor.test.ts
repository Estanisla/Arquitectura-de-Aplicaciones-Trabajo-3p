import { describe, it, expect, afterEach, vi } from 'vitest'

const { deactivateVendor } = await import('./deactivateVendor.ts')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('deactivateVendor', () => {
  it('sends PATCH to correct URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ ok: true, message: 'Tienda desactivada' }),
        { status: 200 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await deactivateVendor('vendor-id-1')

    expect(result.ok).toBe(true)
    const callUrl = fetchMock.mock.calls[0]?.[0] as string
    expect(callUrl).toContain('/api/admin/vendors/vendor-id-1/deactivate')
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PATCH')
  })

  it('returns ok false on 404', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: 'Vendedor no encontrado' }),
          { status: 404 },
        ),
      ),
    )

    const result = await deactivateVendor('bad-id')
    expect(result.ok).toBe(false)
    expect(result.message).toBe('Vendedor no encontrado')
  })

  it('throws on 500', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: 'Error del servidor' }),
          { status: 500 },
        ),
      ),
    )

    await expect(deactivateVendor('bad-id')).rejects.toThrow(
      'Error del servidor',
    )
  })
})
