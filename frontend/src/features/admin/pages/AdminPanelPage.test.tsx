import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mockFetchManagedStores = vi.fn()
const mockFetchReviews = vi.fn()

vi.mock('../api/fetchManagedStores.ts', () => ({
  fetchManagedStores: () => mockFetchManagedStores(),
}))

vi.mock('../api/fetchReviews.ts', () => ({
  fetchReviews: () => mockFetchReviews(),
}))

vi.mock('../api/createManagedStore.ts', () => ({
  createManagedStore: vi.fn(),
}))

vi.mock('../api/removeReview.ts', () => ({
  removeReview: vi.fn(),
}))

const managedStores = {
  emporium_name: 'Emporio Azul',
  stores: [
    {
      store_id: 'store-1',
      display_name: 'Tienda Central',
      description: 'Local principal',
      is_active: true,
      created_at: '2026-06-28T00:00:00Z',
      members: [
        {
          username: 'propietario',
          role: 'owner',
          is_active: true,
          must_change_password: true,
        },
        {
          username: 'encargado',
          role: 'manager',
          is_active: true,
          must_change_password: true,
        },
      ],
      contacts: [{ channel: 'whatsapp', value: '51999999999' }],
    },
  ],
}

beforeEach(() => {
  mockFetchManagedStores.mockResolvedValue(managedStores)
  mockFetchReviews.mockResolvedValue([])
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('AdminPanelPage', () => {
  it('shows the emporium, stores, members and contacts', async () => {
    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
    render(<AdminPanelPage />)

    expect(
      await screen.findByText('Emporio Azul: tiendas (1)'),
    ).toBeInTheDocument()
    expect(screen.getByText('Tienda Central')).toBeInTheDocument()
    expect(
      screen.getByText(/propietario \(Propietario\)/),
    ).toBeInTheDocument()
    expect(screen.getByText(/encargado \(Administrador\)/)).toBeInTheDocument()
    expect(screen.getByText(/whatsapp: 51999999999/)).toBeInTheDocument()
  })

  it('keeps review moderation available when store storage fails', async () => {
    mockFetchManagedStores.mockRejectedValue(new Error('supabase unavailable'))
    mockFetchReviews.mockResolvedValue([
      {
        id: 'review-demo',
        product_id: 'product-demo',
        vendor_id: 'vendor-demo',
        product_name: 'Polo de demostracion',
        store_name: 'Tienda de demostracion',
        rating: 2,
        comment: 'Resena disponible',
        created_at: '2026-06-28T00:00:00Z',
        status: 'visible',
        moderated_at: null,
      },
    ])

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
    render(<AdminPanelPage />)

    expect(
      await screen.findByText('Gestion de tiendas no disponible'),
    ).toBeInTheDocument()
    expect(screen.getByText('Resena disponible')).toBeInTheDocument()
  })

  it('removes a review after confirmation', async () => {
    mockFetchReviews.mockResolvedValue([
      {
        id: 'review-1',
        product_id: 'product-1',
        vendor_id: 'vendor-1',
        product_name: 'Polo azul',
        store_name: 'Tienda Central',
        rating: 1,
        comment: 'Contenido inapropiado',
        created_at: '2026-06-28T00:00:00Z',
        status: 'visible',
        moderated_at: null,
      },
    ])
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const removeReview = vi.mocked(
      (await import('../api/removeReview.ts')).removeReview,
    )
    removeReview.mockResolvedValue()

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
    render(<AdminPanelPage />)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Eliminar' }))

    await waitFor(() => {
      expect(removeReview).toHaveBeenCalledWith('review-1')
    })
    expect(
      screen.getByText('Resena eliminada correctamente'),
    ).toBeInTheDocument()
  })

  it('retries store loading after an error', async () => {
    mockFetchManagedStores
      .mockRejectedValueOnce(new Error('temporary'))
      .mockResolvedValueOnce(managedStores)

    const { AdminPanelPage } = await import('./AdminPanelPage.tsx')
    render(<AdminPanelPage />)
    const user = userEvent.setup()

    await user.click(await screen.findByRole('button', { name: 'Reintentar' }))

    expect(
      await screen.findByText('Emporio Azul: tiendas (1)'),
    ).toBeInTheDocument()
  })
})
