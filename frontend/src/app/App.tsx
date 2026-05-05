import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { RequireRoleRoute } from './guards/RequireRoleRoute'
import { VendorLoginPage } from '../features/auth/pages/VendorLoginPage'
import { VendorRegisterPage } from '../features/auth/pages/VendorRegisterPage'
import { AdminLoginPage } from '../features/auth/pages/AdminLoginPage'
import { HomePage } from '../features/home/pages/HomePage'
import { VendorAreaPlaceholderPage } from '../features/vendor/pages/VendorAreaPlaceholderPage'
import { AdminAreaPlaceholderPage } from '../features/admin/pages/AdminAreaPlaceholderPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/auth/login" element={<VendorLoginPage />} />
        <Route path="/auth/register" element={<VendorRegisterPage />} />
        <Route path="/auth/lg-admin" element={<AdminLoginPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/vendor"
          element={
            <RequireRoleRoute allowedRoles={['vendor']}>
              <VendorAreaPlaceholderPage />
            </RequireRoleRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRoleRoute allowedRoles={['admin']}>
              <AdminAreaPlaceholderPage />
            </RequireRoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

