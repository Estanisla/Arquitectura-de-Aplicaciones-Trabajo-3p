import type { AuditLogEntry } from '../api/fetchAuditLogs'

type AuditLogsTableProps = {
  logs: AuditLogEntry[]
}

const formatDate = (isoDate: string): string => {
  const parsed = new Date(isoDate)
  if (Number.isNaN(parsed.getTime())) return isoDate
  return parsed.toLocaleString()
}

export function AuditLogsTable({ logs }: AuditLogsTableProps) {
  if (logs.length === 0) {
    return <p>No hay eventos registrados para el filtro actual.</p>
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Origen</th>
          <th>Accion</th>
          <th>Tabla</th>
          <th>Fila</th>
          <th>Actor</th>
          <th>Motivo</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log, index) => (
          <tr key={`${log.source}-${log.event_time}-${index}`}>
            <td>{formatDate(log.event_time)}</td>
            <td>{log.source}</td>
            <td>{log.action}</td>
            <td>{log.table_name}</td>
            <td>{log.row_id ?? '-'}</td>
            <td>{log.actor ?? '-'}</td>
            <td>{log.reason ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
