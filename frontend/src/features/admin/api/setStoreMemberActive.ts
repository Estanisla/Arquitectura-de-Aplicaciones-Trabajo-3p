import { env } from '../../../shared/config/env'

export async function setStoreMemberActive(
  storeId: string,
  username: string,
  isActive: boolean,
): Promise<void> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/admin/stores/${encodeURIComponent(storeId)}/members/${encodeURIComponent(username)}`,
    {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive }),
    },
  )

  if (!response.ok) {
    throw new Error('No se pudo actualizar el usuario')
  }
}
