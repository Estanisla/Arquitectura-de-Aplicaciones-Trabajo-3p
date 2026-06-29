import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchProductReviews = vi.fn()
const createProductReview = vi.fn()

vi.mock('../api/productReviewsApi', () => ({
  fetchProductReviews: (...args: unknown[]) => fetchProductReviews(...args),
  createProductReview: (...args: unknown[]) => createProductReview(...args),
}))

beforeEach(() => {
  fetchProductReviews.mockResolvedValue([])
  createProductReview.mockResolvedValue({
    id: 'review-1',
    product_id: 'product-1',
    vendor_id: 'vendor-1',
    rating: 5,
    comment: 'Excelente',
    created_at: '2026-06-29T00:00:00Z',
  })
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ProductReviews', () => {
  it('shows the empty state and publishes an anonymous review', async () => {
    const { ProductReviews } = await import('./ProductReviews')
    render(<ProductReviews productId="product-1" vendorId="vendor-1" />)

    expect(
      await screen.findByText('Se el primero en dejar una resena.'),
    ).toBeInTheDocument()

    const user = userEvent.setup()
    await user.type(screen.getByLabelText('Comentario'), 'Excelente')
    await user.click(screen.getByRole('button', { name: 'Publicar resena' }))

    await waitFor(() => {
      expect(createProductReview).toHaveBeenCalledWith(
        'product-1',
        'vendor-1',
        5,
        'Excelente',
      )
    })
  })

  it('renders visible reviews without internal fields', async () => {
    fetchProductReviews.mockResolvedValue([{
      id: 'internal-id',
      product_id: 'product-1',
      vendor_id: 'vendor-1',
      rating: 4,
      comment: 'Buena compra',
      created_at: '2026-06-29T00:00:00Z',
    }])
    const { ProductReviews } = await import('./ProductReviews')
    render(<ProductReviews productId="product-1" vendorId="vendor-1" />)

    expect(await screen.findByText(/Buena compra/)).toBeInTheDocument()
    expect(screen.queryByText('internal-id')).not.toBeInTheDocument()
  })
})
