import { afterEach, describe, expect, it, vi } from 'vitest'
import { addStoreMember } from './addStoreMember'
import { setStoreMemberActive } from './setStoreMemberActive'
import { updateStoreContacts } from './updateStoreContacts'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('store management action APIs', () => {
  it('send authenticated member and contact operations', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await addStoreMember('store-1', 'manager', 'Temporal123')
    await setStoreMemberActive('store-1', 'manager', false)
    await updateStoreContacts('store-1', [{
      channel: 'email',
      value: 'demo@example.com',
    }])

    expect(fetchMock.mock.calls[0]?.[1]?.credentials).toBe('include')
    expect(fetchMock.mock.calls[1]?.[1]?.method).toBe('PATCH')
    expect(fetchMock.mock.calls[2]?.[1]?.method).toBe('PUT')
  })

  it('throw generic errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('private host', { status: 500 })),
    )
    await expect(
      addStoreMember('store-1', 'manager', 'Temporal123'),
    ).rejects.toThrow('No se pudo agregar el usuario')
  })
})
