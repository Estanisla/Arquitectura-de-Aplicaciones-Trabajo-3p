import { describe, it, expect } from 'vitest'

const { parseAuthResponse } = await import('./parseAuthResponse.ts')

describe('parseAuthResponse', () => {
  it('parses a valid JSON body', async () => {
    const response = new Response(
      JSON.stringify({
        ok: true,
        message: 'Login correcto',
        user_id: 'vendor-1',
      }),
      { status: 200 },
    )

    const result = await parseAuthResponse(response, 'Login')

    expect(result).toEqual({
      ok: true,
      message: 'Login correcto',
      user_id: 'vendor-1',
    })
  })

  it('rejects an empty body', async () => {
    const response = new Response('', { status: 500 })

    await expect(
      parseAuthResponse(response, 'Register'),
    ).rejects.toThrow('No se pudo completar la solicitud. Intenta nuevamente.')
  })

  it('rejects invalid JSON', async () => {
    const response = new Response('not-json', { status: 200 })

    await expect(
      parseAuthResponse(response, 'Login'),
    ).rejects.toThrow('No se pudo completar la solicitud. Intenta nuevamente.')
  })
})
