import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { AuthGuard, AdminGuard, StaffGuard } from '@/features/auth/Guards'
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
import TasksPage from '@/features/tasks/TasksPage'
import CreditsApprovalPage from '@/features/credits/CreditsApprovalPage'

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Routes>
          {/* ─── Shared Dashboard (Adapts automatically to User Role) ─── */}
          <Route path="/" element={<DashboardPage />} />

          {/* ─── Staff Only Operations (Blocked for Admin) ─────────── */}
          <Route
            path="/candidates"
            element={
              <StaffGuard>
                <CandidatesListPage />
              </StaffGuard>
            }
          />
          <Route
            path="/candidates/:id"
            element={
              <StaffGuard>
                <CandidateDetailPage />
              </StaffGuard>
            }
          />
          <Route
            path="/reports"
            element={
              <StaffGuard>
                <ReportsPage />
              </StaffGuard>
            }
          />
          <Route
            path="/tasks"
            element={
              <StaffGuard>
                <TasksPage />
              </StaffGuard>
            }
          />
          <Route
            path="/credits"
            element={
              <StaffGuard>
                <CreditsApprovalPage />
              </StaffGuard>
            }
          />
          <Route
            path="/map"
            element={
              <StaffGuard>
                <MapPage />
              </StaffGuard>
            }
          />

          {/* ─── Admin Only Management (Blocked for Staff) ─────────── */}
          <Route
            path="/staff"
            element={
              <AdminGuard>
                <StaffDirectoryPage />
              </AdminGuard>
            }
          />
          <Route
            path="/staff/:id"
            element={
              <AdminGuard>
                <StaffDetailPage />
              </AdminGuard>
            }
          />
          <Route
            path="/roles"
            element={
              <AdminGuard>
                <RolesPage />
              </AdminGuard>
            }
          />
          <Route
            path="/settings"
            element={
              <AdminGuard>
                <SystemSettingsPage />
              </AdminGuard>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <AdminGuard>
                <AuditLogsPage />
              </AdminGuard>
            }
          />

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
