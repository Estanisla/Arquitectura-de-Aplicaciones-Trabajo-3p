import type { AdminVendorItem } from '../api/fetchVendors'

type VendorTableProps = {
  vendors: AdminVendorItem[]
  onDeactivate: (vendorId: string) => void
}

export function VendorTable({ vendors, onDeactivate }: VendorTableProps) {
  if (vendors.length === 0) {
    return <p className="feedback">No hay vendedores registrados.</p>
  }

  return (
    <table className="vendor-table">
      <thead>
        <tr>
          <th>Usuario</th>
          <th>Tienda</th>
          <th>Activo</th>
          <th>Cambio pass</th>
          <th>Creado</th>
          <th>Accion</th>
        </tr>
      </thead>
      <tbody>
        {vendors.map((v) => (
          <tr key={v.vendor_id}>
            <td>{v.username}</td>
            <td>{v.display_name}</td>
            <td>{v.is_active ? 'Si' : 'No'}</td>
            <td>{v.must_change_password ? 'Pendiente' : 'Completado'}</td>
            <td>{new Date(v.created_at).toLocaleDateString()}</td>
            <td>
              {v.is_active && (
                <button
                  className="button-link button-link--danger"
                  onClick={() => onDeactivate(v.vendor_id)}
                >
                  Desactivar
                </button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
