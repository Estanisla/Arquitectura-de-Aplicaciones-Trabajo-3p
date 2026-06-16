import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockFetchVendors = vi.fn()

vi.mock('../api/fetchVendors.ts', () => ({
  fetchVendors: () => mockFetchVendors(),
}))

vi.mock('../api/deactivateVendor.ts', () => ({
  deactivateVendor: vi.fn(),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AdminPanelPage', () => {
  it('shows loading state initially', async () => {
    mockFetchVendors.mockImplementation(
      () =>
        new Promise(() => {}),
    )

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')

    render(<AdminPanelPage />)

    expect(
      screen.getByText('Cargando panel de administracion...'),
    ).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    mockFetchVendors.mockRejectedValue(new Error('Error de red'))

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')

    render(<AdminPanelPage />)

    expect(
      await screen.findByText('Error de red'),
    ).toBeInTheDocument()
  })

  it('shows vendor count when loaded', async () => {
    mockFetchVendors.mockResolvedValue([
      {
        user_id: 'u1',
        username: 'vendor1',
        display_name: 'Tienda 1',
        vendor_id: 'v-1',
        is_active: true,
        is_deleted: false,
        must_change_password: false,
        created_at: '2025-01-01T00:00:00Z',
      },
    ])

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')

    render(<AdminPanelPage />)

    await waitFor(() => {
      expect(
        screen.getByText(/Vendedores registrados/),
      ).toBeInTheDocument()
    })

    expect(screen.getByText(/\(1\)/)).toBeInTheDocument()
    expect(screen.getByText('vendor1')).toBeInTheDocument()
  })

  it('shows empty vendors message', async () => {
    mockFetchVendors.mockResolvedValue([])

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')

    render(<AdminPanelPage />)

    await waitFor(() => {
      expect(
        screen.getByText('No hay vendedores registrados.'),
      ).toBeInTheDocument()
    })
  })
})
