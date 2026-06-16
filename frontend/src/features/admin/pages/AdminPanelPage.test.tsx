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

const activeVendor = {
  user_id: 'u1',
  username: 'vendor1',
  display_name: 'Tienda 1',
  vendor_id: 'v-1',
  is_active: true,
  is_deleted: false,
  must_change_password: false,
  created_at: '2025-01-01T00:00:00Z',
}

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

  it('shows fallback error message when fetch throws a non-Error', async () => {
    mockFetchVendors.mockRejectedValue('string error')

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')

    render(<AdminPanelPage />)

    expect(
      await screen.findByText('Error al cargar vendedores'),
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

  describe('handleDeactivate', () => {
    it('does nothing when confirm is cancelled', async () => {
      mockFetchVendors.mockResolvedValue([activeVendor])
      vi.spyOn(window, 'confirm').mockReturnValue(false)
      const deactivateVendor = vi.mocked(
        (await import('../api/deactivateVendor.ts')).deactivateVendor,
      )

      const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
      render(<AdminPanelPage />)

      await waitFor(() => {
        expect(screen.getByText('Desactivar')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('Desactivar'))

      expect(deactivateVendor).not.toHaveBeenCalled()
      vi.spyOn(window, 'confirm').mockRestore()
    })

    it('shows success feedback and reloads when deactivation succeeds', async () => {
      mockFetchVendors.mockResolvedValue([activeVendor])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const deactivateVendor = vi.mocked(
        (await import('../api/deactivateVendor.ts')).deactivateVendor,
      )
      deactivateVendor.mockResolvedValue({ ok: true, message: 'Tienda desactivada' })

      const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
      render(<AdminPanelPage />)

      await waitFor(() => {
        expect(screen.getByText('Desactivar')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('Desactivar'))

      await waitFor(() => {
        expect(
          screen.getByText('Tienda desactivada correctamente'),
        ).toBeInTheDocument()
      })

      expect(mockFetchVendors).toHaveBeenCalled()
    })

    it('shows error feedback when API returns ok false', async () => {
      mockFetchVendors.mockResolvedValue([activeVendor])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const deactivateVendor = vi.mocked(
        (await import('../api/deactivateVendor.ts')).deactivateVendor,
      )
      deactivateVendor.mockResolvedValue({ ok: false, message: 'Error al desactivar' })

      const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
      render(<AdminPanelPage />)

      await waitFor(() => {
        expect(screen.getByText('Desactivar')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('Desactivar'))

      await waitFor(() => {
        expect(screen.getByText('Error al desactivar')).toBeInTheDocument()
      })
    })

    it('shows error feedback when deactivate API throws', async () => {
      mockFetchVendors.mockResolvedValue([activeVendor])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const deactivateVendor = vi.mocked(
        (await import('../api/deactivateVendor.ts')).deactivateVendor,
      )
      deactivateVendor.mockRejectedValue(new Error('Error de red'))

      const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
      render(<AdminPanelPage />)

      await waitFor(() => {
        expect(screen.getByText('Desactivar')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('Desactivar'))

      await waitFor(() => {
        expect(screen.getByText('Error de red')).toBeInTheDocument()
      })
    })

    it('shows fallback error when deactivate throws a non-Error', async () => {
      mockFetchVendors.mockResolvedValue([activeVendor])
      vi.spyOn(window, 'confirm').mockReturnValue(true)
      const deactivateVendor = vi.mocked(
        (await import('../api/deactivateVendor.ts')).deactivateVendor,
      )
      deactivateVendor.mockRejectedValue('string error')

      const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
      render(<AdminPanelPage />)

      await waitFor(() => {
        expect(screen.getByText('Desactivar')).toBeInTheDocument()
      })

      const user = userEvent.setup()
      await user.click(screen.getByText('Desactivar'))

      await waitFor(() => {
        expect(screen.getByText('Error al desactivar')).toBeInTheDocument()
      })
    })
  })

  it('handles unmount before fetch completes to cover cleanup', async () => {
    // Retrasamos la respuesta para asegurar que el desmontaje ocurra antes
    mockFetchVendors.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve([]), 50)),
    )

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')

    // Extraemos unmount para destruir el componente bajo demanda
    const { unmount } = render(<AdminPanelPage />)

    // Forzamos el desmontaje inmediato (ejecuta el return del useEffect)
    unmount()

    // Avanzamos el reloj/tiempo para que la promesa se resuelva en el limbo
    await new Promise((resolve) => setTimeout(resolve, 60))
  })
})
