import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ChangePasswordForm } from './ChangePasswordForm.tsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('ChangePasswordForm', () => {
  it('renders all fields and submit button', () => {
    render(<ChangePasswordForm onSuccess={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Cambiar contrasena' }),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Contrasena actual'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Nueva contrasena'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Confirmar nueva contrasena'),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Cambiar contrasena' }),
    ).toBeInTheDocument()
  })

  it('shows error when new passwords do not match', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm onSuccess={vi.fn()} />)

    await user.type(
      screen.getByLabelText('Contrasena actual'),
      'old123',
    )
    await user.type(screen.getByLabelText('Nueva contrasena'), 'new456')
    await user.type(
      screen.getByLabelText('Confirmar nueva contrasena'),
      'different',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contrasena' }),
    )

    expect(
      screen.getByText('Las contrasenas no coinciden'),
    ).toBeInTheDocument()
  })

  it('shows error when new password is too short', async () => {
    const user = userEvent.setup()
    render(<ChangePasswordForm onSuccess={vi.fn()} />)

    await user.type(
      screen.getByLabelText('Contrasena actual'),
      'old123',
    )
    await user.type(screen.getByLabelText('Nueva contrasena'), 'ab')
    await user.type(
      screen.getByLabelText('Confirmar nueva contrasena'),
      'ab',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contrasena' }),
    )

    expect(
      screen.getByText(
        'La nueva contrasena debe tener al menos 6 caracteres',
      ),
    ).toBeInTheDocument()
  })

  it('shows error when API returns ok false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: 'Contrasena actual incorrecta' }),
          { status: 400 },
        ),
      ),
    )

    const user = userEvent.setup()
    render(<ChangePasswordForm onSuccess={vi.fn()} />)

    await user.type(screen.getByLabelText('Contrasena actual'), 'wrong')
    await user.type(screen.getByLabelText('Nueva contrasena'), 'new456')
    await user.type(
      screen.getByLabelText('Confirmar nueva contrasena'),
      'new456',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contrasena' }),
    )

    expect(
      await screen.findByText('Contrasena actual incorrecta'),
    ).toBeInTheDocument()
  })

  it('shows error when fetch throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Error de red')),
    )

    const user = userEvent.setup()
    render(<ChangePasswordForm onSuccess={vi.fn()} />)

    await user.type(screen.getByLabelText('Contrasena actual'), 'old123')
    await user.type(screen.getByLabelText('Nueva contrasena'), 'new456')
    await user.type(
      screen.getByLabelText('Confirmar nueva contrasena'),
      'new456',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contrasena' }),
    )

    expect(
      await screen.findByText('Error de red'),
    ).toBeInTheDocument()
  })

  it('shows fallback error when fetch throws a non-Error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue('string error'),
    )

    const user = userEvent.setup()
    render(<ChangePasswordForm onSuccess={vi.fn()} />)

    await user.type(screen.getByLabelText('Contrasena actual'), 'old123')
    await user.type(screen.getByLabelText('Nueva contrasena'), 'new456')
    await user.type(
      screen.getByLabelText('Confirmar nueva contrasena'),
      'new456',
    )
    await user.click(
      screen.getByRole('button', { name: 'Cambiar contrasena' }),
    )

    expect(
      await screen.findByText('Error inesperado'),
    ).toBeInTheDocument()
  })

  it('calls onSuccess on API success', async () => {
    const onSuccess = vi.fn()
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, message: 'Cambiada' }),
          { status: 200 },
        ),
      ),
    )

    const user = userEvent.setup()
    render(<ChangePasswordForm onSuccess={onSuccess} />)

    await user.type(
      screen.getByLabelText('Contrasena actual'),
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

    expect(onSuccess).toHaveBeenCalled()
    expect(
      await screen.findByText('Contrasena cambiada correctamente'),
    ).toBeInTheDocument()
  })
})
