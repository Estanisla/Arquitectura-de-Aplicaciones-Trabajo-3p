import { env } from '../../../shared/config/env'

export async function addStoreMember(
  storeId: string,
  username: string,
  tempPassword: string,
): Promise<void> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/admin/stores/${encodeURIComponent(storeId)}/members`,
    {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, tempPassword }),
    },
  )

  if (!response.ok) {
    throw new Error('No se pudo agregar el usuario')
  }
}
