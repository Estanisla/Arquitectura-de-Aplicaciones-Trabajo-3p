import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
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
})
