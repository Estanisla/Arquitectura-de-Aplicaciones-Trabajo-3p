import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { VendorStorePage } from './VendorStorePage.tsx'

vi.mock('../api/fetchVendorProfile.ts', () => ({
  fetchVendorProfile: vi.fn(),
}))

const { fetchVendorProfile } = await import('../api/fetchVendorProfile.ts')

const renderAtRoute = (vendorId: string) =>
  render(
    <MemoryRouter initialEntries={[`/tiendas/${vendorId}`]}>
      <Routes>
        <Route path="/tiendas/:vendorId" element={<VendorStorePage />} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(cleanup)

describe('VendorStorePage', () => {
  it('shows loading state initially', () => {
    vi.mocked(fetchVendorProfile).mockReturnValue(new Promise(() => {}))

    renderAtRoute('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

    expect(screen.getByText('Cargando tienda...')).toBeInTheDocument()
  })

  it('shows display_name and description when loaded', async () => {
    vi.mocked(fetchVendorProfile).mockResolvedValue({
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: 'Plantas y jardineria',
      products: [],
    })

    renderAtRoute('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

    await waitFor(() => {
      expect(screen.getByText('GrowaGarden')).toBeInTheDocument()
      expect(screen.getByText('Plantas y jardineria')).toBeInTheDocument()
    })
  })

  it('renders products when they exist', async () => {
    vi.mocked(fetchVendorProfile).mockResolvedValue({
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: null,
      products: [
        { id: '1', name: 'Maceta', description: null, image_url: null },
        { id: '2', name: 'Tierra', description: null, image_url: null },
      ],
    })

    renderAtRoute('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

    await waitFor(() => {
      expect(screen.getByText('Maceta')).toBeInTheDocument()
      expect(screen.getByText('Tierra')).toBeInTheDocument()
    })
  })

  it('renders safe direct contact links', async () => {
    vi.mocked(fetchVendorProfile).mockResolvedValue({
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: null,
      products: [],
      contacts: [
        { channel: 'whatsapp', value: '+51 999 999 999' },
        { channel: 'instagram', value: '@growagarden' },
      ],
    })

    renderAtRoute('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

    expect(
      await screen.findByRole('heading', { name: 'Contactar con la tienda' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute(
      'href',
      'https://wa.me/51999999999',
    )
    expect(screen.getByRole('link', { name: 'Instagram' })).toHaveAttribute(
      'href',
      'https://instagram.com/growagarden',
    )
  })

  it('shows empty products message when products is empty', async () => {
    vi.mocked(fetchVendorProfile).mockResolvedValue({
      vendor_id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      display_name: 'GrowaGarden',
      description: null,
      products: [],
    })

    renderAtRoute('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

    await waitFor(() => {
      expect(
        screen.getByText('Esta tienda aun no tiene productos.'),
      ).toBeInTheDocument()
    })
  })

  it('shows "Esta tienda no existe" for not-found error', async () => {
    vi.mocked(fetchVendorProfile).mockRejectedValue(
      new Error('Vendedor no encontrado'),
    )

    renderAtRoute('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

    await waitFor(() => {
      expect(screen.getByText('Esta tienda no existe.')).toBeInTheDocument()
    })
  })

  it('shows generic error for other errors', async () => {
    vi.mocked(fetchVendorProfile).mockRejectedValue(
      new Error('network error'),
    )

    renderAtRoute('aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee')

    await waitFor(() => {
      expect(
        screen.getByText('Error al cargar la tienda. Intenta de nuevo.'),
      ).toBeInTheDocument()
    })
  })
})
