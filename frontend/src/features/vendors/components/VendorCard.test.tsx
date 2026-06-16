import { describe, it, expect, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { VendorCard } from './VendorCard.tsx'
import type { VendorListItem } from '../vendor.types.ts'

const renderWithRouter = (element: React.ReactElement) =>
  render(<BrowserRouter>{element}</BrowserRouter>)

afterEach(() => {
  cleanup()
})

describe('VendorCard', () => {
  it('shows the display_name', () => {
    const vendor: VendorListItem = {
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: 'Plantas y jardineria',
      products: [],
    }

    renderWithRouter(<VendorCard vendor={vendor} />)

    expect(screen.getByText('GrowaGarden')).toBeInTheDocument()
  })

  it('shows the description when present', () => {
    const vendor: VendorListItem = {
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: 'Plantas y jardineria',
      products: [],
    }

    renderWithRouter(<VendorCard vendor={vendor} />)

    expect(screen.getByText('Plantas y jardineria')).toBeInTheDocument()
  })

  it('renders a preview per product', () => {
    const vendor: VendorListItem = {
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: null,
      products: [
        { id: '1', name: 'Maceta', description: null, image_url: null },
        { id: '2', name: 'Tierra', description: null, image_url: null },
      ],
    }

    renderWithRouter(<VendorCard vendor={vendor} />)

    expect(screen.getByText('Maceta')).toBeInTheDocument()
    expect(screen.getByText('Tierra')).toBeInTheDocument()
  })

  it('shows empty message when products is empty', () => {
    const vendor: VendorListItem = {
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: null,
      products: [],
    }

    renderWithRouter(<VendorCard vendor={vendor} />)

    expect(
      screen.getByText('Esta tienda aun no tiene productos'),
    ).toBeInTheDocument()
  })

  it('links to /tiendas/<vendor_id>', () => {
    const vendor: VendorListItem = {
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: null,
      products: [],
    }

    renderWithRouter(<VendorCard vendor={vendor} />)

    const link = screen.getByRole('link', { name: 'Ver tienda completa' })
    expect(link).toHaveAttribute(
      'href',
      '/tiendas/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    )
  })
})
