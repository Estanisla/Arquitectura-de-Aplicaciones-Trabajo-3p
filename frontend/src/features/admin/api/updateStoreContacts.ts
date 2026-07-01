import { env } from '../../../shared/config/env'
import type { StoreContactInput } from '../storeManagement.types'

export async function updateStoreContacts(
  storeId: string,
  contacts: StoreContactInput[],
): Promise<void> {
  const response = await fetch(
    `${env.API_BASE_URL}/api/admin/stores/${encodeURIComponent(storeId)}/contacts`,
    {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contacts }),
    },
  )

  if (!response.ok) {
    throw new Error('No se pudieron actualizar los contactos')
  }
}
