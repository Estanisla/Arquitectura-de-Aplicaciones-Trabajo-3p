import { afterEach, describe, expect, it, vi } from 'vitest'
import { removeReview } from './removeReview'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('removeReview', () => {
  it('sends an authenticated delete request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await removeReview('review-1')

    expect(fetchMock.mock.calls[0]?.[0]).toContain(
      '/api/admin/reviews/review-1',
    )
    expect(fetchMock.mock.calls[0]?.[1]).toMatchObject({
      method: 'DELETE',
      credentials: 'include',
    })
  })

  it('replaces backend details with a generic error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: 'ObjectId invalid' }),
          { status: 400 },
        ),
      ),
    )

    await expect(removeReview('bad-id')).rejects.toThrow(
      'No se pudo completar la solicitud. Intenta nuevamente.',
    )
  })
})
