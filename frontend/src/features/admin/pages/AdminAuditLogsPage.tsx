import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  fetchAuditLogs,
  type AuditLogEntry,
  type AuditLogSource,
} from '../api/fetchAuditLogs'
import { AuditLogsTable } from '../components/AuditLogsTable'

type PageStatus = 'loading' | 'ready' | 'error'
type Filter = AuditLogSource | 'all'

const PAGE_SIZE = 50

export function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([])
  const [status, setStatus] = useState<PageStatus>('loading')
  const [filter, setFilter] = useState<Filter>('all')
  const [offset, setOffset] = useState(0)
  const [errorMessage, setErrorMessage] = useState('')

  const load = useCallback(async (nextFilter: Filter, nextOffset: number) => {
    setStatus('loading')
    try {
      const data = await fetchAuditLogs({
        table: nextFilter === 'all' ? undefined : nextFilter,
        limit: PAGE_SIZE,
        offset: nextOffset,
      })
      setLogs(data)
      setStatus('ready')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al cargar logs'
      setErrorMessage(message)
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    void load(filter, offset)
  }, [load, filter, offset])

  const handleFilterChange = (next: Filter) => {
    setOffset(0)
    setFilter(next)
  }

  return (
    <section className="card-stack">
      <article className="card">
        <h2>Auditoria del panel</h2>
        <p>
          Consulta unificada de eventos de <code>admins</code>,{' '}
          <code>users</code> y <code>vendors</code>. Los eventos se registran
          automaticamente vía triggers en la base de datos.
        </p>
        <p>
          <Link to="/admin" className="inline-link">
            Volver al panel
          </Link>
        </p>
      </article>

      <article className="card">
        <label className="field">
          <span>Filtrar por origen</span>
          <select
            value={filter}
            onChange={(event) => handleFilterChange(event.target.value as Filter)}
          >
            <option value="all">Todos</option>
            <option value="admins">Admins</option>
            <option value="users">Usuarios</option>
            <option value="vendors">Tiendas</option>
          </select>
        </label>
      </article>

      <article className="card">
        {status === 'loading' && <p>Cargando eventos...</p>}
        {status === 'error' && (
          <p className="feedback feedback--error">{errorMessage}</p>
        )}
        {status === 'ready' && <AuditLogsTable logs={logs} />}
      </article>

      <article className="card">
        <div className="button-row">
          <button
            type="button"
            className="button-link button-link--secondary"
            disabled={offset === 0 || status === 'loading'}
            onClick={() => setOffset(Math.max(offset - PAGE_SIZE, 0))}
          >
            Anterior
          </button>
          <button
            type="button"
            className="button-link"
            disabled={status === 'loading' || logs.length < PAGE_SIZE}
            onClick={() => setOffset(offset + PAGE_SIZE)}
          >
            Siguiente
          </button>
        </div>
      </article>
    </section>
  )
}
