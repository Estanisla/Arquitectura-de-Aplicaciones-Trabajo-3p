import type { ProductPreview } from '../vendor.types'

type VendorProductPreviewProps = {
  product: ProductPreview
}

export function VendorProductPreview({ product }: VendorProductPreviewProps) {
  const truncatedDescription =
    product.description && product.description.length > 80
      ? `${product.description.slice(0, 80)}...`
      : product.description

  return (
    <div className="vendor-product-preview">
      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.name}
          className="vendor-product-preview__image"
        />
      ) : (
        <div className="vendor-product-preview__placeholder">Sin imagen</div>
      )}
      <h4 className="vendor-product-preview__name">{product.name}</h4>
      {truncatedDescription && (
        <p className="vendor-product-preview__desc">{truncatedDescription}</p>
      )}
    </div>
  )
}
