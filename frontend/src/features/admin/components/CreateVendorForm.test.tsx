import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateVendorForm } from './CreateVendorForm.tsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('CreateVendorForm', () => {
  it('renders all fields', () => {
    render(<CreateVendorForm onCreated={vi.fn()} />)

    expect(
      screen.getByRole('heading', { name: 'Crear nuevo vendedor' }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Username')).toBeInTheDocument()
    expect(
      screen.getByLabelText('Contrasena temporal'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Nombre de tienda'),
    ).toBeInTheDocument()
    expect(
      screen.getByLabelText('Descripcion (opcional)'),
    ).toBeInTheDocument()
  })

  it('shows validation error for short username', async () => {
    const user = userEvent.setup()
    render(<CreateVendorForm onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText('Username'), 'ab')
    await user.type(
      screen.getByLabelText('Contrasena temporal'),
      'temp123',
    )
    await user.type(
      screen.getByLabelText('Nombre de tienda'),
      'Tienda',
    )
    await user.click(
      screen.getByRole('button', { name: 'Crear vendedor' }),
    )

    expect(
      screen.getByText('El username debe tener al menos 3 caracteres'),
    ).toBeInTheDocument()
  })

  it('shows validation error for short password', async () => {
    const user = userEvent.setup()
    render(<CreateVendorForm onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText('Username'), 'validuser')
    await user.type(
      screen.getByLabelText('Contrasena temporal'),
      'ab',
    )
    await user.type(
      screen.getByLabelText('Nombre de tienda'),
      'Tienda',
    )
    await user.click(
      screen.getByRole('button', { name: 'Crear vendedor' }),
    )

    expect(
      screen.getByText(
        'La contrasena temporal debe tener al menos 6 caracteres',
      ),
    ).toBeInTheDocument()
  })

  it('shows validation error for short display name', async () => {
    const user = userEvent.setup()
    render(<CreateVendorForm onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText('Username'), 'validuser')
    await user.type(
      screen.getByLabelText('Contrasena temporal'),
      'temp123',
    )
    await user.type(screen.getByLabelText('Nombre de tienda'), 'A')
    await user.click(
      screen.getByRole('button', { name: 'Crear vendedor' }),
    )

    expect(
      screen.getByText(
        'El nombre de tienda debe tener al menos 2 caracteres',
      ),
    ).toBeInTheDocument()
  })

  it('shows temp password on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: true,
            message: 'Creado',
            userId: 'uid',
            vendorId: 'vid',
          }),
          { status: 201 },
        ),
      ),
    )

    const user = userEvent.setup()
    render(<CreateVendorForm onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText('Username'), 'newvendor')
    await user.type(
      screen.getByLabelText('Contrasena temporal'),
      'tempPass123',
    )
    await user.type(
      screen.getByLabelText('Nombre de tienda'),
      'Mi Tienda',
    )
    await user.click(
      screen.getByRole('button', { name: 'Crear vendedor' }),
    )

    expect(
      await screen.findByText('tempPass123'),
    ).toBeInTheDocument()
  })

  it('shows error when API returns ok false', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            message: 'El username ya existe',
          }),
          { status: 409 },
        ),
      ),
    )

    const user = userEvent.setup()
    render(<CreateVendorForm onCreated={vi.fn()} />)

    await user.type(screen.getByLabelText('Username'), 'exists')
    await user.type(
      screen.getByLabelText('Contrasena temporal'),
      'temp123',
    )
    await user.type(
      screen.getByLabelText('Nombre de tienda'),
      'Ya Existe',
    )
    await user.click(
      screen.getByRole('button', { name: 'Crear vendedor' }),
    )

    expect(
      await screen.findByText('El username ya existe'),
    ).toBeInTheDocument()
  })
})
