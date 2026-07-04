import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './layout/AppShell'
import { RequireRoleRoute } from './guards/RequireRoleRoute'
import { VendorLoginPage } from '../features/auth/pages/VendorLoginPage'
import { VendorRegisterPage } from '../features/auth/pages/VendorRegisterPage'
import { AdminLoginPage } from '../features/auth/pages/AdminLoginPage'
import { HomePage } from '../features/home/pages/HomePage'
import { VendorListPage } from '../features/vendors/pages/VendorListPage'
import { VendorStorePage } from '../features/vendors/pages/VendorStorePage'
import { VendorDashboardPage } from '../features/vendor/pages/VendorDashboardPage'
import { AdminPanelPage } from '../features/admin/pages/AdminPanelPage'
import { AdminReviewsModerationPage } from '../features/admin/pages/AdminReviewsModerationPage'
import { ChangePasswordPage } from '../features/auth/pages/ChangePasswordPage'
import { ProfilePage } from '../features/profile/pages/ProfilePage'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route index element={<HomePage />} />
        <Route path="/tiendas" element={<VendorListPage />} />
        <Route path="/tiendas/:vendorId" element={<VendorStorePage />} />
        <Route path="/auth/login" element={<VendorLoginPage />} />
        <Route path="/auth/register" element={<VendorRegisterPage />} />
        <Route path="/auth/lg-admin" element={<AdminLoginPage />} />
        <Route path="/auth/change-password" element={<ChangePasswordPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route
          path="/vendor"
          element={
            <RequireRoleRoute allowedRoles={['vendor']}>
              <VendorDashboardPage />
            </RequireRoleRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <RequireRoleRoute allowedRoles={['admin']}>
              <AdminPanelPage />
            </RequireRoleRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <RequireRoleRoute allowedRoles={['admin']}>
              <AdminReviewsModerationPage />
            </RequireRoleRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

