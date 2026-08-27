import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AuthGuard } from '@/features/auth/Guards'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/features/auth/LoginPage'
import NotAllowedPage from '@/features/auth/NotAllowedPage'
import MapPage from '@/features/map/MapPage'
import DashboardPage from '@/features/dashboard/DashboardPage'
import RolesPage from '@/features/roles/RolesPage'
import AuditLogsPage from '@/features/audit/AuditLogsPage'
import CandidatesListPage from '@/features/candidates/CandidatesListPage'
import CandidateDetailPage from '@/features/candidates/CandidateDetailPage'
import ReportsPage from '@/features/reports/ReportsPage'
import StaffDirectoryPage from '@/features/staff/StaffDirectoryPage'
import StaffDetailPage from '@/features/staff/StaffDetailPage'
import SystemSettingsPage from '@/features/settings/SystemSettingsPage'

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/staff" element={<StaffDirectoryPage />} />
          <Route path="/staff/:id" element={<StaffDetailPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/candidates" element={<CandidatesListPage />} />
          <Route path="/candidates/:id" element={<CandidateDetailPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/audit-logs" element={<AuditLogsPage />} />
          <Route path="/settings" element={<SystemSettingsPage />} />
          <Route path="/map" element={<MapPage />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
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
