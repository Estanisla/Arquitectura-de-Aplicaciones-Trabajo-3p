import { describe, it, expect, afterEach, vi } from 'vitest'

const { createVendor } = await import('./createVendor.ts')

const buildFetchMock = (status: number, body: unknown) => {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('createVendor', () => {
  it('sends POST with correct payload', async () => {
    const fetchMock = buildFetchMock(201, {
      ok: true,
      message: 'Creado',
      userId: 'uid',
      vendorId: 'vid',
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await createVendor({
      username: 'nuevo',
      tempPassword: 'temp123',
      displayName: 'Tienda Nueva',
      description: 'Desc',
    })

    expect(result.ok).toBe(true)
    expect(result.userId).toBe('uid')
    const callUrl = fetchMock.mock.calls[0]?.[0] as string
    expect(callUrl).toContain('/api/admin/vendors')
    const callBody = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body as string,
    )
    expect(callBody.username).toBe('nuevo')
    expect(callBody.tempPassword).toBe('temp123')
    expect(callBody.displayName).toBe('Tienda Nueva')
    expect(callBody.description).toBe('Desc')
  })

  it('returns ok false on 409', async () => {
    vi.stubGlobal(
      'fetch',
      buildFetchMock(409, {
        ok: false,
        message: 'El username ya existe',
      }),
    )

    const result = await createVendor({
      username: 'exists',
      tempPassword: 'temp123',
      displayName: 'Test',
    })

    expect(result.ok).toBe(false)
    expect(result.message).toBe('El username ya existe')
  })

  it('throws on 500', async () => {
    vi.stubGlobal(
      'fetch',
      buildFetchMock(500, { ok: false, message: 'Error' }),
    )

    await expect(
      createVendor({
        username: 'test',
        tempPassword: 'temp123',
        displayName: 'Test',
      }),
    ).rejects.toThrow('Error')
  })
})
