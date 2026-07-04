import { env } from '../../../shared/config/env'
import {
  DEFAULT_LOAD_ERROR_MESSAGE,
  parseJsonResponse,
} from '../../../shared/errors/publicErrors'

export type AuditLogSource = 'admins' | 'users' | 'vendors'

export type AuditLogEntry = {
  source: AuditLogSource
  event_time: string
  action: string
  table_name: string
  row_id: string | null
  actor: string | null
  reason: string | null
}

type FetchAuditLogsResponse = {
  ok: boolean
  data?: AuditLogEntry[]
  message?: string
}

export type FetchAuditLogsParams = {
  table?: AuditLogSource
  limit?: number
  offset?: number
}

export const fetchAuditLogs = async (
  params: FetchAuditLogsParams = {},
): Promise<AuditLogEntry[]> => {
  const search = new URLSearchParams()
  if (params.table) search.set('table', params.table)
  if (typeof params.limit === 'number') search.set('limit', String(params.limit))
  if (typeof params.offset === 'number') search.set('offset', String(params.offset))
  const query = search.toString() ? `?${search.toString()}` : ''

  const response = await fetch(`${env.API_BASE_URL}/api/admin/logs${query}`, {
    method: 'GET',
    credentials: 'include',
  })

  const result = await parseJsonResponse<FetchAuditLogsResponse>(response)

  if (!response.ok) {
    throw new Error(result.message ?? DEFAULT_LOAD_ERROR_MESSAGE)
  }

  return result.data ?? []
}
