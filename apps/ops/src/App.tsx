import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/features/auth/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthGuard, AdminGuard, StaffGuard } from '@/features/auth/Guards'
import { AppShell } from '@/components/layout/AppShell'
import LoginPage from '@/features/auth/LoginPage'
import NotAllowedPage from '@/features/auth/NotAllowedPage'

// Overview
import DashboardPage from '@/features/dashboard/DashboardPage'

// Identity & Access
import UsersPage from '@/features/users/UsersPage'
import RolesPage from '@/features/roles/RolesPage'

// Traffic Sign Governance
import CatalogPage from '@/features/catalog/CatalogPage'
import MissingSignsPage from '@/features/catalog/MissingSignsPage'
import SpatialOverridesPage from '@/features/spatial/SpatialOverridesPage'
import AdminEscalationsPage from '@/features/escalations/AdminEscalationsPage'

// Economy
import CreditRulesPage from '@/features/economy/CreditRulesPage'
import CreditsApprovalPage from '@/features/credits/CreditsApprovalPage'

// AI & Processing (MLOps)
import MlopsPage from '@/features/mlops/MlopsPage'

// Data
import SpatialDataExportPage from '@/features/exports/SpatialDataExportPage'

// System
import SystemSettingsPage from '@/features/settings/SystemSettingsPage'
import AuditLogsPage from '@/features/audit/AuditLogsPage'

// Staff Specific Routes
import CandidatesListPage from '@/features/candidates/CandidatesListPage'
import CandidateDetailPage from '@/features/candidates/CandidateDetailPage'
import MapPage from '@/features/map/MapPage'
import TasksPage from '@/features/tasks/TasksPage'

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Routes>
          {/* ─── Shared Overview Dashboard ─────────────────────────── */}
          <Route path="/" element={<DashboardPage />} />

          {/* ─── Identity & Access (Admin) ─────────────────────────── */}
          <Route
            path="/users"
            element={
              <AdminGuard>
                <UsersPage />
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

          {/* ─── Traffic Sign Governance (Admin / Staff Accessible) ── */}
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/missing-types" element={<MissingSignsPage />} />
          <Route
            path="/spatial-data"
            element={
              <AdminGuard>
                <SpatialOverridesPage />
              </AdminGuard>
            }
          />
          <Route
            path="/escalations"
            element={
              <AdminGuard>
                <AdminEscalationsPage />
              </AdminGuard>
            }
          />

          {/* ─── Economy ───────────────────────────────────────────── */}
          <Route
            path="/credits/rules"
            element={
              <AdminGuard>
                <CreditRulesPage />
              </AdminGuard>
            }
          />
          <Route
            path="/credits/payments"
            element={<CreditsApprovalPage />}
          />
          <Route
            path="/credits"
            element={<CreditsApprovalPage />}
          />

          {/* ─── AI & Processing (MLOps) ───────────────────────────── */}
          <Route
            path="/mlops"
            element={
              <AdminGuard>
                <MlopsPage />
              </AdminGuard>
            }
          />

          {/* ─── Data Export ───────────────────────────────────────── */}
          <Route
            path="/exports"
            element={<SpatialDataExportPage />}
          />

          {/* ─── System Configuration & Audit ──────────────────────── */}
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

          {/* ─── Staff Operations ──────────────────────────────────── */}
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
            path="/map"
            element={<MapPage />}
          />
          <Route
            path="/tasks"
            element={<TasksPage />}
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
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/403" element={<NotAllowedPage />} />
            <Route path="/*" element={<ProtectedLayout />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
