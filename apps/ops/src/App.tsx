import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AuthGuard } from '@/features/auth/Guards'
import { AdminGuard } from '@/features/auth/Guards'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/features/auth/LoginPage'
import NotAllowedPage from '@/features/auth/NotAllowedPage'
import MapPage from '@/features/map/MapPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import PlaceholderPage from '@/components/common/PlaceholderPage'

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/map" element={<MapPage />} />
          <Route path="/moderation" element={<PlaceholderPage title="Kiểm duyệt" />} />
          <Route path="/tasks" element={<PlaceholderPage title="Vùng khảo sát" />} />
          <Route path="/reports" element={<PlaceholderPage title="Sự cố biển báo" />} />
          <Route path="/credits" element={<PlaceholderPage title="Duyệt thưởng" />} />
          <Route path="/settings" element={<PlaceholderPage title="Cài đặt cá nhân" />} />

          {/* Admin-only routes */}
          <Route path="/admin" element={<AdminGuard><PlaceholderPage title="KPIs & Analytics" /></AdminGuard>} />
          <Route path="/admin/users" element={<AdminGuard><PlaceholderPage title="Quản lý User" /></AdminGuard>} />
          <Route path="/admin/catalog" element={<AdminGuard><PlaceholderPage title="Danh mục QCVN 41" /></AdminGuard>} />
          <Route path="/admin/settings" element={<AdminGuard><PlaceholderPage title="Cài đặt hệ thống" /></AdminGuard>} />
          <Route path="/admin/audit-logs" element={<AdminGuard><PlaceholderPage title="Audit Logs" /></AdminGuard>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </AppShell>
    </AuthGuard>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/403" element={<NotAllowedPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
