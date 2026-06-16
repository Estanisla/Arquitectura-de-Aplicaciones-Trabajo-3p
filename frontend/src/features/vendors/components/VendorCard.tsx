import { Link } from 'react-router-dom'
import type { VendorListItem } from '../vendor.types'
import { VendorProductPreview } from './VendorProductPreview'

type VendorCardProps = {
  vendor: VendorListItem
}

export function VendorCard({ vendor }: VendorCardProps) {
  return (
    <article className="vendor-card">
      <h3 className="vendor-card__name">{vendor.display_name}</h3>
      {vendor.description && (
        <p className="vendor-card__desc">{vendor.description}</p>
      )}
      {vendor.products.length > 0 ? (
        <div className="vendor-card__grid">
          {vendor.products.map((product) => (
            <VendorProductPreview key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="vendor-card__empty">Esta tienda aun no tiene productos</p>
      )}
      <Link
        to={`/tiendas/${vendor.vendor_id}`}
        className="vendor-card__link"
      >
        Ver tienda completa
      </Link>
    </article>
  )
}
