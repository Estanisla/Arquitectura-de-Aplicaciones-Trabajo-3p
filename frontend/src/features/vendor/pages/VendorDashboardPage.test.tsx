import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const fetchStores = vi.fn()
const fetchStore = vi.fn()
const fetchReviews = vi.fn()

vi.mock('../api/vendorDashboardApi', () => ({
  fetchManagedVendorStores: () => fetchStores(),
  fetchVendorStoreDashboard: (id: string) => fetchStore(id),
  fetchVendorStoreReviews: (id: string) => fetchReviews(id),
}))
vi.mock('../components/VendorStoreSettings', () => ({
  VendorStoreSettings: () => <div>Configuracion de tienda</div>,
}))
vi.mock('../components/VendorProductManager', () => ({
  VendorProductManager: () => <div>Gestion de productos</div>,
}))
vi.mock('../components/VendorReviewList', () => ({
  VendorReviewList: () => <div>Listado de resenas</div>,
}))

beforeEach(() => {
  fetchStores.mockResolvedValue([{
    store_id: 'store-1',
    display_name: 'Tienda Central',
    member_role: 'manager',
  }])
  fetchStore.mockResolvedValue({
    store_id: 'store-1',
    display_name: 'Tienda Central',
    description: null,
    is_active: true,
    member_role: 'manager',
    products: [],
    contacts: [],
  })
  fetchReviews.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('VendorDashboardPage', () => {
  it('shows the assigned store and manager role', async () => {
    const { VendorDashboardPage } = await import('./VendorDashboardPage')
    render(<VendorDashboardPage />)

    expect(
      await screen.findByText('Administrar Tienda Central'),
    ).toBeInTheDocument()
    expect(screen.getByText(/Rol en la tienda: Administrador/)).toBeInTheDocument()
    expect(screen.getByText('Gestion de productos')).toBeInTheDocument()
  })

  it('shows an explicit state when the user has no store', async () => {
    fetchStores.mockResolvedValue([])
    const { VendorDashboardPage } = await import('./VendorDashboardPage')
    render(<VendorDashboardPage />)

    expect(
      await screen.findByText(/No tienes una tienda activa asignada/),
    ).toBeInTheDocument()
  })

  it('allows a user to switch between assigned stores', async () => {
    fetchStores.mockResolvedValue([
      {
        store_id: 'store-1',
        display_name: 'Tienda Central',
        member_role: 'owner',
      },
      {
        store_id: 'store-2',
        display_name: 'Tienda Norte',
        member_role: 'manager',
      },
    ])
    fetchStore.mockImplementation(async (id: string) => ({
      store_id: id,
      display_name: id === 'store-2' ? 'Tienda Norte' : 'Tienda Central',
      description: null,
      is_active: true,
      member_role: id === 'store-2' ? 'manager' : 'owner',
      products: [],
      contacts: [],
    }))
    const { VendorDashboardPage } = await import('./VendorDashboardPage')
    render(<VendorDashboardPage />)
    const user = userEvent.setup()

    await screen.findByText('Administrar Tienda Central')
    await user.selectOptions(screen.getByLabelText('Tienda'), 'store-2')

    expect(await screen.findByText('Administrar Tienda Norte')).toBeInTheDocument()
    expect(fetchStore).toHaveBeenCalledWith('store-2')
  })
})
