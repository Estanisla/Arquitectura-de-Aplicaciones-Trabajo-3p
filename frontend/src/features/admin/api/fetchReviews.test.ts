import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchReviews } from './fetchReviews'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('fetchReviews', () => {
  it('returns reviews without exposing response metadata', async () => {
    const reviews = [
      {
        id: 'review-1',
        product_id: 'product-1',
        vendor_id: 'vendor-1',
        product_name: 'Polo azul clasico',
        store_name: 'Tienda Central',
        rating: 5,
        comment: 'Excelente',
        created_at: '2026-06-28T00:00:00Z',
        status: 'visible',
        moderated_at: null,
      },
    ]
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, data: reviews }), {
        status: 200,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const result = await fetchReviews()

    expect(result).toEqual(reviews)
    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include')
  })

  it('uses a generic load error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            message: 'mongodb://internal-host/reviews',
          }),
          { status: 500 },
        ),
      ),
    )

    await expect(fetchReviews()).rejects.toThrow(
      'No se pudo cargar la informacion. Intenta nuevamente.',
    )
  })
})
