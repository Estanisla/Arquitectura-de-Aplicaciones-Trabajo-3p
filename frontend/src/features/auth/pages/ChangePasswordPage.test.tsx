import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn()
const mockRefreshSession = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('../session/useAuthSession', () => ({
  useAuthSession: () => ({
    refreshSession: mockRefreshSession,
  }),
}))

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ChangePasswordPage', () => {
  it('renders ChangePasswordForm', async () => {
    const { ChangePasswordPage } = await import(
      './ChangePasswordPage.tsx'
    )

    render(
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>,
    )

    expect(
      await screen.findByRole('heading', {
        name: 'Cambiar contrasena',
      }),
    ).toBeInTheDocument()
  })

  it('calls refreshSession and navigates on successful password change', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, message: 'Cambiada' }),
          { status: 200 },
        ),
      ),
    )

    const { ChangePasswordPage } = await import(
      './ChangePasswordPage.tsx'
    )

    render(
      <MemoryRouter>
        <ChangePasswordPage />
      </MemoryRouter>,
    )

    const user = userEvent.setup()

    await user.type(
      await screen.findByLabelText('Contrasena actual'),
      'old123',
    )
    await user.type(
      screen.getByLabelText('Nueva contrasena'),
      'new456',
    )
    await user.type(
      screen.getByLabelText('Confirmar nueva contrasena'),
      'new456',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contrasena' }),
    )

    await waitFor(() => {
      expect(mockRefreshSession).toHaveBeenCalledOnce()
      expect(mockNavigate).toHaveBeenCalledWith('/vendor', {
        replace: true,
      })
    })
  })
})
