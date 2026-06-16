import { useEffect, useState } from 'react'
import { VendorCard } from '../../vendors/components/VendorCard'
import { fetchVendorList } from '../../vendors/api/fetchVendorList'
import type { VendorListItem } from '../../vendors/vendor.types'

export function VendorList() {
  const [vendors, setVendors] = useState<VendorListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false

    fetchVendorList()
      .then((data) => {
        if (!cancelled) {
          setVendors(data)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return <p className="vendor-list__status">Cargando tiendas...</p>
  }

  if (error) {
    return (
      <p className="vendor-list__status">
        Error al cargar los vendedores. Intenta de nuevo.
      </p>
    )
  }

  if (vendors.length === 0) {
    return (
      <p className="vendor-list__status">
        No hay tiendas disponibles por el momento.
      </p>
    )
  }

  return (
    <div className="vendor-list">
      {vendors.map((vendor) => (
        <VendorCard key={vendor.vendor_id} vendor={vendor} />
      ))}
    </div>
  )
}
