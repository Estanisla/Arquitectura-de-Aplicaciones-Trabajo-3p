import { describe, it, expect, afterEach, vi } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { VendorTable } from './VendorTable.tsx'
import type { AdminVendorItem } from '../api/fetchVendors'

afterEach(() => {
  cleanup()
})

const vendors: AdminVendorItem[] = [
  {
    user_id: 'u1',
    username: 'vendor1',
    display_name: 'Tienda 1',
    vendor_id: 'v-1',
    is_active: true,
    is_deleted: false,
    must_change_password: true,
    created_at: '2025-01-01T00:00:00Z',
  },
  {
    user_id: 'u2',
    username: 'vendor2',
    display_name: 'Tienda 2',
    vendor_id: 'v-2',
    is_active: false,
    is_deleted: false,
    must_change_password: false,
    created_at: '2025-02-01T00:00:00Z',
  },
]

describe('VendorTable', () => {
  it('shows empty message when no vendors', () => {
    render(
      <VendorTable vendors={[]} onDeactivate={vi.fn()} />,
    )

    expect(
      screen.getByText('No hay vendedores registrados.'),
    ).toBeInTheDocument()
  })

  it('renders vendor rows', () => {
    render(
      <VendorTable vendors={vendors} onDeactivate={vi.fn()} />,
    )

    expect(screen.getByText('vendor1')).toBeInTheDocument()
    expect(screen.getByText('Tienda 1')).toBeInTheDocument()
    expect(screen.getByText('vendor2')).toBeInTheDocument()
    expect(screen.getByText('Tienda 2')).toBeInTheDocument()
  })

  it('shows Si for active and No for inactive', () => {
    render(
      <VendorTable vendors={vendors} onDeactivate={vi.fn()} />,
    )

    const activeCells = screen.getAllByText('Si')
    expect(activeCells).toHaveLength(1)
  })

  it('shows deactivate button only for active vendors', () => {
    render(
      <VendorTable vendors={vendors} onDeactivate={vi.fn()} />,
    )

    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(1)
    expect(buttons[0]).toHaveTextContent('Desactivar')
  })

  it('calls onDeactivate when deactivate button is clicked', async () => {
    const onDeactivate = vi.fn()
    const user = userEvent.setup()

    render(
      <VendorTable vendors={vendors} onDeactivate={onDeactivate} />,
    )

    await user.click(screen.getByRole('button', { name: 'Desactivar' }))
    expect(onDeactivate).toHaveBeenCalledWith('v-1')
  })
})
