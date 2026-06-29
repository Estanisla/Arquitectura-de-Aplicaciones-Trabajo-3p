import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CreateManagedStoreForm } from './CreateManagedStoreForm'

const mockCreateManagedStore = vi.fn()

vi.mock('../api/createManagedStore', () => ({
  createManagedStore: (payload: unknown) => mockCreateManagedStore(payload),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('CreateManagedStoreForm', () => {
  it('creates one store with an owner, manager and contact', async () => {
    mockCreateManagedStore.mockResolvedValue({
      ok: true,
      message: 'Creada',
      storeId: 'store-1',
    })
    const onCreated = vi.fn()
    const user = userEvent.setup()
    render(
      <CreateManagedStoreForm
        currentEmporiumName={null}
        onCreated={onCreated}
      />,
    )

    await user.type(screen.getByLabelText('Nombre del emporio'), 'Emporio Azul')
    await user.type(screen.getByLabelText('Nombre de la tienda'), 'Tienda Central')
    const usernameInputs = screen.getAllByLabelText('Username')
    const passwordInputs = screen.getAllByLabelText('Contrasena temporal')
    await user.type(usernameInputs[0]!, 'propietario')
    await user.type(passwordInputs[0]!, 'Temporal123')
    await user.click(screen.getByRole('button', { name: 'Agregar otro usuario' }))
    const updatedUsers = screen.getAllByLabelText('Username')
    const updatedPasswords = screen.getAllByLabelText('Contrasena temporal')
    await user.type(updatedUsers[1]!, 'encargado')
    await user.type(updatedPasswords[1]!, 'Temporal456')
    await user.type(screen.getByLabelText('whatsapp'), '51999999999')
    await user.click(screen.getByRole('button', { name: 'Crear tienda' }))

    await waitFor(() => expect(mockCreateManagedStore).toHaveBeenCalledOnce())
    expect(mockCreateManagedStore.mock.calls[0]?.[0]).toMatchObject({
      emporiumName: 'Emporio Azul',
      displayName: 'Tienda Central',
      members: [
        { username: 'propietario', role: 'owner' },
        { username: 'encargado', role: 'manager' },
      ],
      contacts: [{ channel: 'whatsapp', value: '51999999999' }],
    })
    expect(onCreated).toHaveBeenCalledOnce()
  })
})
