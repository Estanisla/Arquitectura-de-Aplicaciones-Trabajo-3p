import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const mocks = vi.hoisted(() => ({
  loginAdmin: vi.fn(),
  refreshSession: vi.fn(),
  authState: {
    status: 'anonymous',
    isAuthenticated: false,
    role: null as 'admin' | 'vendor' | null,
  },
}))

vi.mock('../api/loginAdmin', () => ({
  loginAdmin: mocks.loginAdmin,
}))

vi.mock('../session/useAuthSession', () => ({
  useAuthSession: () => ({
    ...mocks.authState,
    refreshSession: mocks.refreshSession,
  }),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  mocks.authState.status = 'anonymous'
  mocks.authState.isAuthenticated = false
  mocks.authState.role = null
})

describe('AdminLoginPage', () => {
  it('refreshes the session after valid credentials', async () => {
    mocks.loginAdmin.mockResolvedValue({
      ok: true,
      message: 'Acceso correcto',
    })
    mocks.refreshSession.mockResolvedValue(undefined)

    const { AdminLoginPage } = await import('./AdminLoginPage.tsx')
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AdminLoginPage />
      </MemoryRouter>,
    )

    await user.type(screen.getByLabelText('Usuario admin'), 'moderador')
    await user.type(screen.getByLabelText('Password'), 'Moderacion123!')
    await user.click(
      screen.getByRole('button', { name: 'Ingresar como admin' }),
    )

    await waitFor(() => {
      expect(mocks.loginAdmin).toHaveBeenCalledWith({
        username: 'moderador',
        password: 'Moderacion123!',
      })
      expect(mocks.refreshSession).toHaveBeenCalledOnce()
    })
  })

  it('navigates only after the admin session is confirmed', async () => {
    mocks.authState.status = 'authenticated'
    mocks.authState.isAuthenticated = true
    mocks.authState.role = 'admin'

    const { AdminLoginPage } = await import('./AdminLoginPage.tsx')

    render(
      <MemoryRouter initialEntries={['/auth/lg-admin']}>
        <Routes>
          <Route path="/auth/lg-admin" element={<AdminLoginPage />} />
          <Route path="/admin" element={<h2>Panel confirmado</h2>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', { name: 'Panel confirmado' }),
    ).toBeInTheDocument()
  })
})
