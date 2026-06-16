import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { VendorList } from './VendorList.tsx'
import type { VendorListItem } from '../../vendors/vendor.types.ts'

vi.mock('../../vendors/api/fetchVendorList.ts', () => ({
  fetchVendorList: vi.fn(),
}))

const { fetchVendorList } = await import('../../vendors/api/fetchVendorList.ts')

const renderWithRouter = (element: React.ReactElement) =>
  render(<BrowserRouter>{element}</BrowserRouter>)

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('VendorList', () => {
  it('shows loading state initially', () => {
    vi.mocked(fetchVendorList).mockReturnValue(new Promise(() => {}))

    renderWithRouter(<VendorList />)

    expect(screen.getByText('Cargando tiendas...')).toBeInTheDocument()
  })

  it('renders a VendorCard per vendor on success', async () => {
    const vendor: VendorListItem = {
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: null,
      products: [],
    }

    vi.mocked(fetchVendorList).mockResolvedValue([vendor])

    renderWithRouter(<VendorList />)

    await waitFor(() => {
      expect(screen.getByText('GrowaGarden')).toBeInTheDocument()
    })
  })

  it('shows error message when fetch fails', async () => {
    vi.mocked(fetchVendorList).mockRejectedValue(new Error('network error'))

    renderWithRouter(<VendorList />)

    await waitFor(() => {
      expect(
        screen.getByText(
          'Error al cargar los vendedores. Intenta de nuevo.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('shows empty message when fetch returns empty array', async () => {
    vi.mocked(fetchVendorList).mockResolvedValue([])

    renderWithRouter(<VendorList />)

    await waitFor(() => {
      expect(
        screen.getByText('No hay tiendas disponibles por el momento.'),
      ).toBeInTheDocument()
    })
  })
})
