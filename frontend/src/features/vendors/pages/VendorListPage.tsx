import { VendorList } from '../../home/components/VendorList'
import './VendorListPage.css'

export function VendorListPage() {
  return (
    <div className="vendor-list-page">
      <header className="vendor-list-page__header">
        <p className="vendor-list-page__kicker">Directorio de tiendas</p>
        <h1 className="vendor-list-page__title">Tiendas</h1>
        <p className="vendor-list-page__lead">
          Descubre todas las tiendas del centro comercial, explora una vista
          previa de sus productos y entra a la que más te guste.
        </p>
      </header>
      <VendorList />
    </div>
  )
}
