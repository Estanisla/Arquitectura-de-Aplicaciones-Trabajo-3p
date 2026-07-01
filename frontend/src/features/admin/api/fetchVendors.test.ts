import { describe, it, expect, afterEach, vi } from 'vitest'

const { fetchVendors } = await import('./fetchVendors.ts')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('fetchVendors', () => {
  it('returns vendor list on success', async () => {
    const vendors = [
      {
        user_id: 'u1',
        username: 'v1',
        display_name: 'T1',
        vendor_id: 'v-1',
        is_active: true,
        is_deleted: false,
        must_change_password: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ]

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, vendors }),
          { status: 200 },
        ),
      ),
    )

    const result = await fetchVendors()
    expect(result).toHaveLength(1)
    expect(result[0]?.username).toBe('v1')
  })

  it('returns empty array when no vendors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, vendors: [] }),
          { status: 200 },
        ),
      ),
    )

    const result = await fetchVendors()
    expect(result).toEqual([])
  })

  it('throws on non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: 'No autorizado' }),
          { status: 403 },
        ),
      ),
    )

    await expect(fetchVendors()).rejects.toThrow(
      'No se pudo cargar la informacion. Intenta nuevamente.',
    )
  })

  it('uses fallback message when result.message is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false }),
          { status: 500 },
        ),
      ),
    )

    await expect(fetchVendors()).rejects.toThrow(
      'No se pudo cargar la informacion. Intenta nuevamente.',
    )
  })

  it('returns empty array when vendors field is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true }),
          { status: 200 },
        ),
      ),
    )

    const result = await fetchVendors()
    expect(result).toEqual([])
  })
})
