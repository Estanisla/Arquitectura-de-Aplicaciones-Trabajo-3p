import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createProductReview,
  fetchProductReviews,
} from './productReviewsApi'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('productReviewsApi', () => {
  it('loads and creates public reviews', async () => {
    const review = {
      id: 'review-1',
      product_id: 'product-1',
      vendor_id: 'vendor-1',
      rating: 5,
      comment: 'Excelente',
      created_at: '2026-06-29T00:00:00Z',
    }
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, data: [review] }), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, data: review }), {
          status: 201,
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchProductReviews('product-1')).resolves.toEqual([review])
    await expect(
      createProductReview('product-1', 'vendor-1', 5, 'Excelente'),
    ).resolves.toEqual(review)
    expect(JSON.parse(fetchMock.mock.calls[1]?.[1]?.body as string)).toEqual({
      vendor_id: 'vendor-1',
      rating: 5,
      comment: 'Excelente',
    })
  })

  it('uses generic errors for failed requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('internal endpoint', { status: 500 })),
    )
    await expect(fetchProductReviews('product-1')).rejects.toThrow(
      'No se pudieron cargar las resenas',
    )
  })
})
