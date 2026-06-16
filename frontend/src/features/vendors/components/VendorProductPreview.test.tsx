import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { VendorProductPreview } from './VendorProductPreview.tsx'
import type { ProductPreview } from '../vendor.types'

const placeholderSelector = 'div.vendor-product-preview__placeholder'

afterEach(() => {
  cleanup()
})

describe('VendorProductPreview', () => {
  it('renders image when image_url is provided', () => {
    const product: ProductPreview = {
      id: 'p1',
      name: 'Producto 1',
      description: 'Descripcion del producto',
      image_url: 'https://example.com/img.jpg',
    }

    render(<VendorProductPreview product={product} />)

    const img = screen.getByRole('img')
    expect(img).toHaveAttribute('src', 'https://example.com/img.jpg')
    expect(img).toHaveAttribute('alt', 'Producto 1')
    expect(
      document.querySelector(placeholderSelector),
    ).not.toBeInTheDocument()
  })

  it('renders placeholder when image_url is null', () => {
    const product: ProductPreview = {
      id: 'p2',
      name: 'Producto 2',
      description: 'Descripcion valida',
      image_url: null,
    }

    render(<VendorProductPreview product={product} />)

    expect(
      document.querySelector(placeholderSelector),
    ).toBeInTheDocument()
    expect(
      document.querySelector(placeholderSelector),
    ).toHaveTextContent('Sin imagen')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('renders placeholder when image_url is empty string', () => {
    const product: ProductPreview = {
      id: 'p3',
      name: 'Producto 3',
      description: 'Descripcion valida',
      image_url: '',
    }

    render(<VendorProductPreview product={product} />)

    expect(
      document.querySelector(placeholderSelector),
    ).toBeInTheDocument()
    expect(
      document.querySelector(placeholderSelector),
    ).toHaveTextContent('Sin imagen')
  })

  it('renders product name', () => {
    const product: ProductPreview = {
      id: 'p4',
      name: 'Producto 4',
      description: null,
      image_url: null,
    }

    render(<VendorProductPreview product={product} />)

    expect(screen.getByText('Producto 4')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    const product: ProductPreview = {
      id: 'p5',
      name: 'Producto 5',
      description: 'Descripcion corta',
      image_url: null,
    }

    render(<VendorProductPreview product={product} />)

    expect(screen.getByText('Descripcion corta')).toBeInTheDocument()
  })

  it('truncates long description', () => {
    const product: ProductPreview = {
      id: 'p6',
      name: 'Producto 6',
      description: 'A'.repeat(100),
      image_url: null,
    }

    render(<VendorProductPreview product={product} />)

    expect(
      screen.getByText(`${'A'.repeat(80)}...`),
    ).toBeInTheDocument()
  })
})
