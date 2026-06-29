import { useState } from 'react'
import type { FormEvent } from 'react'
import {
  createVendorProduct,
  removeVendorProduct,
  updateVendorProduct,
} from '../api/vendorDashboardApi'
import type { VendorProduct } from '../vendorDashboard.types'
import { DEFAULT_ERROR_MESSAGE } from '../../../shared/errors/publicErrors'

type Props = {
  storeId: string
  products: VendorProduct[]
  onChanged: () => void
}

export function VendorProductManager({ storeId, products, onChanged }: Props) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')

  const createProduct = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setFeedback('')
    try {
      await createVendorProduct(storeId, { name, description, imageUrl })
      setName('')
      setDescription('')
      setImageUrl('')
      setFeedback('Producto creado correctamente')
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  const toggleVisibility = async (product: VendorProduct) => {
    setBusy(true)
    setFeedback('')
    try {
      await updateVendorProduct(product.id, {
        name: product.name,
        description: product.description ?? '',
        imageUrl: product.image_url ?? '',
        isVisible: !product.is_visible,
      })
      setFeedback('Producto actualizado')
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  const removeProduct = async (productId: string) => {
    if (!window.confirm('Retirar este producto de la tienda?')) return
    setBusy(true)
    setFeedback('')
    try {
      await removeVendorProduct(productId)
      setFeedback('Producto retirado')
      onChanged()
    } catch {
      setFeedback(DEFAULT_ERROR_MESSAGE)
    } finally {
      setBusy(false)
    }
  }

  return (
    <section>
      <h3>Productos ({products.length})</h3>
      <form className="form-grid product-create-form" onSubmit={(event) => void createProduct(event)}>
        <label className="field">
          <span>Nombre</span>
          <input value={name} onChange={(event) => setName(event.target.value)} required />
        </label>
        <label className="field">
          <span>Descripcion</span>
          <input
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>
        <label className="field">
          <span>URL de imagen</span>
          <input value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
        </label>
        <button className="button-link" disabled={busy}>
          Agregar producto
        </button>
      </form>
      {feedback && <p className="feedback">{feedback}</p>}
      {products.length === 0 ? (
        <p className="feedback">La tienda aun no tiene productos.</p>
      ) : (
        <div className="admin-table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <strong>{product.name}</strong>
                    {product.description && <p>{product.description}</p>}
                  </td>
                  <td>{product.is_visible ? 'Visible' : 'Oculto'}</td>
                  <td>
                    <button
                      type="button"
                      className="button-link button-link--secondary button-link--compact"
                      disabled={busy}
                      onClick={() => void toggleVisibility(product)}
                    >
                      {product.is_visible ? 'Ocultar' : 'Publicar'}
                    </button>
                    <button
                      type="button"
                      className="button-link button-link--danger button-link--compact"
                      disabled={busy}
                      onClick={() => void removeProduct(product.id)}
                    >
                      Retirar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
