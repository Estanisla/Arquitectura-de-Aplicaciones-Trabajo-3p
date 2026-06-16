import type { ProductPreview } from '../vendor.types'

type VendorProductGridProps = {
  products: ProductPreview[]
}

export function VendorProductGrid({ products }: VendorProductGridProps) {
  if (products.length === 0) {
    return <p>Esta tienda aun no tiene productos.</p>
  }

  return (
    <div className="vendor-product-grid">
      {products.map((product) => (
        <div key={product.id} className="vendor-product-grid__card">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="vendor-product-grid__image"
            />
          ) : (
            <div className="vendor-product-grid__placeholder">Sin imagen</div>
          )}
          <h4>{product.name}</h4>
          {product.description && <p>{product.description}</p>}
        </div>
      ))}
    </div>
  )
}
