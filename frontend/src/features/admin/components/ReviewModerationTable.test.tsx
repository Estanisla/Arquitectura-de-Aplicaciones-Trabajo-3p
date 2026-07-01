import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ReviewModerationTable } from './ReviewModerationTable'

afterEach(cleanup)

describe('ReviewModerationTable', () => {
  it('shows safe review fields and only allows visible reviews to be removed', () => {
    const onRemove = vi.fn()
    render(
      <ReviewModerationTable
        onRemove={onRemove}
        reviews={[
          {
            id: 'internal-review-id',
            product_id: 'internal-product-id',
            vendor_id: 'internal-vendor-id',
            product_name: 'Polo azul clasico',
            store_name: 'Tienda Central',
            rating: 1,
            comment: 'Contenido visible',
            created_at: '2026-06-28T00:00:00Z',
            status: 'visible',
            moderated_at: null,
          },
          {
            id: 'removed-review-id',
            product_id: 'removed-product-id',
            vendor_id: 'removed-vendor-id',
            product_name: 'Polo azul deportivo',
            store_name: 'Tienda Norte',
            rating: 2,
            comment: 'Contenido eliminado',
            created_at: '2026-06-27T00:00:00Z',
            status: 'removed',
            moderated_at: '2026-06-28T00:00:00Z',
          },
        ]}
      />,
    )

    expect(screen.getByText('Contenido visible')).toBeInTheDocument()
    expect(screen.getByText('Polo azul clasico')).toBeInTheDocument()
    expect(screen.getByText('Tienda Central')).toBeInTheDocument()
    expect(screen.getByText('Eliminada')).toBeInTheDocument()
    expect(screen.queryByText('internal-product-id')).not.toBeInTheDocument()

    const removeButton = screen.getByRole('button', { name: 'Eliminar' })
    fireEvent.click(removeButton)
    expect(onRemove).toHaveBeenCalledWith('internal-review-id')
  })

  it('shows an explicit empty state', () => {
    render(<ReviewModerationTable reviews={[]} onRemove={vi.fn()} />)
    expect(screen.getByText('No hay resenas para moderar.')).toBeInTheDocument()
  })
})
