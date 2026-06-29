import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ManagedStoreTable } from './ManagedStoreTable'

const addStoreMember = vi.fn()
const setStoreMemberActive = vi.fn()
const updateStoreContacts = vi.fn()

vi.mock('../api/addStoreMember', () => ({
  addStoreMember: (...args: unknown[]) => addStoreMember(...args),
}))
vi.mock('../api/setStoreMemberActive', () => ({
  setStoreMemberActive: (...args: unknown[]) => setStoreMemberActive(...args),
}))
vi.mock('../api/updateStoreContacts', () => ({
  updateStoreContacts: (...args: unknown[]) => updateStoreContacts(...args),
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('ManagedStoreTable', () => {
  it('renders safe store, member and contact data', () => {
    render(
      <ManagedStoreTable
        stores={[{
          store_id: 'internal-id',
          display_name: 'Tienda Central',
          description: null,
          is_active: true,
          created_at: '2026-06-28T00:00:00Z',
          members: [{
            username: 'propietario',
            role: 'owner',
            is_active: true,
            must_change_password: true,
          }],
          contacts: [{ channel: 'email', value: 'tienda@example.com' }],
        }]}
        onChanged={() => {}}
      />,
    )

    expect(screen.getByText('Tienda Central')).toBeInTheDocument()
    expect(screen.getByText(/propietario/)).toBeInTheDocument()
    expect(screen.getByText(/email: tienda@example.com/)).toBeInTheDocument()
    expect(screen.queryByText('internal-id')).not.toBeInTheDocument()
  })

  it('renders the empty state', () => {
    render(<ManagedStoreTable stores={[]} onChanged={() => {}} />)
    expect(
      screen.getByText('El emporio aun no tiene tiendas.'),
    ).toBeInTheDocument()
  })

  it('adds managers, changes status and edits contacts', async () => {
    addStoreMember.mockResolvedValue(undefined)
    setStoreMemberActive.mockResolvedValue(undefined)
    updateStoreContacts.mockResolvedValue(undefined)
    const onChanged = vi.fn()
    render(
      <ManagedStoreTable
        onChanged={onChanged}
        stores={[{
          store_id: 'store-1',
          display_name: 'Tienda Central',
          description: null,
          is_active: true,
          created_at: '2026-06-28T00:00:00Z',
          members: [{
            username: 'manager',
            role: 'manager',
            is_active: true,
            must_change_password: false,
          }],
          contacts: [],
        }]}
      />,
    )
    const user = userEvent.setup()

    await user.type(
      screen.getByLabelText('Nuevo usuario para Tienda Central'),
      'nuevo_manager',
    )
    await user.type(
      screen.getByLabelText('Clave temporal para Tienda Central'),
      'Temporal123',
    )
    await user.click(screen.getByRole('button', { name: 'Agregar' }))
    await user.click(screen.getByRole('button', { name: 'Desactivar' }))
    await user.click(screen.getByRole('button', { name: 'Editar' }))
    await user.type(screen.getByLabelText('email'), 'demo@example.com')
    await user.click(screen.getByRole('button', { name: 'Guardar contactos' }))

    await waitFor(() => {
      expect(addStoreMember).toHaveBeenCalledWith(
        'store-1',
        'nuevo_manager',
        'Temporal123',
      )
      expect(setStoreMemberActive).toHaveBeenCalledWith(
        'store-1',
        'manager',
        false,
      )
      expect(updateStoreContacts).toHaveBeenCalledWith('store-1', [{
        channel: 'email',
        value: 'demo@example.com',
      }])
    })
    expect(onChanged).toHaveBeenCalled()
  })
})
