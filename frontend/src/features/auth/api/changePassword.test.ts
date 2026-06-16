import { describe, it, expect, afterEach, vi } from 'vitest'

const { changePassword } = await import('./changePassword.ts')

const buildFetchMock = (status: number, body: unknown) => {
  return vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('changePassword', () => {
  it('sends POST with currentPassword and newPassword', async () => {
    const fetchMock = buildFetchMock(200, { ok: true, message: 'ok' })
    vi.stubGlobal('fetch', fetchMock)

    const result = await changePassword({
      currentPassword: 'old123',
      newPassword: 'new456',
    })

    expect(result.ok).toBe(true)
    const callUrl = fetchMock.mock.calls[0]?.[0] as string
    expect(callUrl).toContain('/api/auth/change-password')
    const callBody = JSON.parse(
      fetchMock.mock.calls[0]?.[1]?.body as string,
    )
    expect(callBody).toEqual({
      currentPassword: 'old123',
      newPassword: 'new456',
    })
  })

  it('returns ok false on 400', async () => {
    vi.stubGlobal(
      'fetch',
      buildFetchMock(400, {
        ok: false,
        message: 'La nueva contrasena debe ser diferente',
      }),
    )

    const result = await changePassword({
      currentPassword: 'same',
      newPassword: 'same',
    })

    expect(result.ok).toBe(false)
    expect(result.message).toBe('La nueva contrasena debe ser diferente')
  })

  it('throws on 500', async () => {
    vi.stubGlobal(
      'fetch',
      buildFetchMock(500, {
        ok: false,
        message: 'Error interno',
      }),
    )

    await expect(
      changePassword({ currentPassword: 'a', newPassword: 'b' }),
    ).rejects.toThrow('Error interno')
  })
})
