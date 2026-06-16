import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { VendorProductGrid } from './VendorProductGrid.tsx'
import type { ProductPreview } from '../vendor.types'

afterEach(() => {
  cleanup()
})

describe('VendorProductGrid', () => {
  it('shows empty message when no products', () => {
    render(<VendorProductGrid products={[]} />)
    expect(
      screen.getByText('Esta tienda aun no tiene productos.'),
    ).toBeInTheDocument()
  })

  it('renders products with images when image_url is provided', () => {
    const products: ProductPreview[] = [
      {
        id: 'p1',
        name: 'Producto 1',
        description: 'Desc 1',
        image_url: 'https://example.com/img1.jpg',
      },
      {
        id: 'p2',
        name: 'Producto 2',
        description: null,
        image_url: null,
      },
    ]

    render(<VendorProductGrid products={products} />)

    const images = screen.getAllByRole('img')
    expect(images).toHaveLength(1)
    expect(images[0]).toHaveAttribute('src', 'https://example.com/img1.jpg')

    expect(screen.getByText('Producto 1')).toBeInTheDocument()
    expect(screen.getByText('Producto 2')).toBeInTheDocument()
    expect(screen.getByText('Desc 1')).toBeInTheDocument()
    expect(screen.getByText('Sin imagen')).toBeInTheDocument()
  })
})
