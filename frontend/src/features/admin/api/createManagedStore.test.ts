import { afterEach, describe, expect, it, vi } from 'vitest'
import { createManagedStore } from './createManagedStore'

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('createManagedStore', () => {
  it('sends the store, members and contacts', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          message: 'Creada',
          storeId: 'store-1',
        }),
        { status: 201 },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    const payload = {
      emporiumName: 'Emporio Azul',
      displayName: 'Tienda Central',
      members: [{
        username: 'propietario',
        tempPassword: 'Temporal123',
        role: 'owner' as const,
      }],
      contacts: [{ channel: 'whatsapp' as const, value: '51999999999' }],
    }

    await expect(createManagedStore(payload)).resolves.toMatchObject({
      ok: true,
      storeId: 'store-1',
    })
    expect(
      JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string),
    ).toEqual(payload)
  })

  it('does not expose backend error details', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ ok: false, message: 'internal database error' }),
          { status: 500 },
        ),
      ),
    )

    await expect(
      createManagedStore({
        emporiumName: 'Emporio',
        displayName: 'Tienda',
        members: [],
        contacts: [],
      }),
    ).rejects.toThrow(
      'No se pudo completar la solicitud. Intenta nuevamente.',
    )
  })
})
