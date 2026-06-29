import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const mocks = vi.hoisted(() => ({
  authState: {
    status: 'authenticated',
    isAuthenticated: true,
    role: 'vendor' as 'admin' | 'vendor',
  },
  logout: vi.fn(),
}))

vi.mock('../../auth/session/useAuthSession', () => ({
  useAuthSession: () => ({
    ...mocks.authState,
    logout: mocks.logout,
  }),
}))

afterEach(() => {
  cleanup()
  mocks.authState.role = 'vendor'
  vi.clearAllMocks()
})

describe('ProfilePage', () => {
  it('shows the vendor role without technical JWT details', async () => {
    const { ProfilePage } = await import('./ProfilePage.tsx')

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Perfil de vendedor' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Sesion activa como vendedor.')).toBeInTheDocument()
    expect(screen.queryByText(/JWT/i)).not.toBeInTheDocument()
  })

  it('shows the administrator role', async () => {
    mocks.authState.role = 'admin'
    const { ProfilePage } = await import('./ProfilePage.tsx')

    render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>,
    )

    expect(
      screen.getByRole('heading', { name: 'Perfil de administrador' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText('Sesion activa con permisos de administracion.'),
    ).toBeInTheDocument()
  })
})
