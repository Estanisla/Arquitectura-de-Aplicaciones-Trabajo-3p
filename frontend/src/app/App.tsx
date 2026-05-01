import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { VendorLoginPage } from '../features/auth/pages/VendorLoginPage'
import { HomePage } from '../features/home/pages/HomePage'
import { VendorAreaPlaceholderPage } from '../features/vendor/pages/VendorAreaPlaceholderPage'
import { AdminAreaPlaceholderPage } from '../features/admin/pages/AdminAreaPlaceholderPage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/auth/login" element={<VendorLoginPage />} />
        <Route path="/vendor" element={<VendorAreaPlaceholderPage />} />
        <Route path="/admin" element={<AdminAreaPlaceholderPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
