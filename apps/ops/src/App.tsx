import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider } from '@/features/auth/AuthContext'
import NotAllowedPage from '@/features/auth/NotAllowedPage'
import { AuthGuard, AdminGuard, StaffGuard } from '@/features/auth/Guards'

// Lazy-loaded pages for bundle splitting
const LoginPage = lazy(() => import('@/features/auth/LoginPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('@/features/auth/ResetPasswordPage'))
const NotFound404Page = lazy(() => import('@/features/auth/NotFound404Page'))

const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'))
const UsersPage = lazy(() => import('@/features/users/UsersPage'))
const RolesPage = lazy(() => import('@/features/roles/RolesPage'))
const CatalogPage = lazy(() => import('@/features/catalog/CatalogPage'))
const MissingSignsPage = lazy(() => import('@/features/catalog/MissingSignsPage'))
const SpatialOverridesPage = lazy(() => import('@/features/spatial/SpatialOverridesPage'))
const AdminEscalationsPage = lazy(() => import('@/features/escalations/AdminEscalationsPage'))
const CreditRulesPage = lazy(() => import('@/features/economy/CreditRulesPage'))
const CreditsApprovalPage = lazy(() => import('@/features/credits/CreditsApprovalPage'))
const AiopsPage = lazy(() => import('@/features/aiops/AiopsPage'))
const SpatialDataExportPage = lazy(() => import('@/features/exports/SpatialDataExportPage'))
const SystemSettingsPage = lazy(() => import('@/features/settings/SystemSettingsPage'))
const AuditLogsPage = lazy(() => import('@/features/audit/AuditLogsPage'))
const CandidatesListPage = lazy(() => import('@/features/candidates/CandidatesListPage'))
const CandidateDetailPage = lazy(() => import('@/features/candidates/CandidateDetailPage'))
const MapPage = lazy(() => import('@/features/map/MapPage'))
const TasksPage = lazy(() => import('@/features/tasks/TasksPage'))
const ReportsPage = lazy(() => import('@/features/reports/ReportsPage'))

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[50vh] w-full">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#00c4de]/20 border-t-[#00c4de] animate-spin" />
        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono tracking-wider">Đang tải trang...</span>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppShell>
        <Suspense fallback={<PageLoadingFallback />}>
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
          <Route
            path="/catalog/new-types"
            element={
              <StaffGuard>
                <MissingSignsPage />
              </StaffGuard>
            }
          />
          <Route path="/catalog/missing-types" element={<Navigate to="/catalog/new-types" replace />} />
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
            element={
              <StaffGuard>
                <CreditsApprovalPage />
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

          {/* ─── AI Pipeline & AIOps ─────────────────────────────── */}
          <Route
            path="/aiops"
            element={
              <AdminGuard>
                <AiopsPage />
              </AdminGuard>
            }
          />
          <Route
            path="/mlops"
            element={
              <AdminGuard>
                <AiopsPage />
              </AdminGuard>
            }
          />

          {/* ─── Data Export ───────────────────────────────────────── */}
          <Route
            path="/exports"
            element={
              <AdminGuard>
                <SpatialDataExportPage />
              </AdminGuard>
            }
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
            element={
              <StaffGuard>
                <TasksPage />
              </StaffGuard>
            }
          />
          <Route
            path="/staff"
            element={<Navigate to="/users" replace />}
          />
          <Route
            path="/staff/:id"
            element={<Navigate to="/users" replace />}
          />
          <Route
            path="/reports"
            element={
              <StaffGuard>
                <ReportsPage />
              </StaffGuard>
            }
          />

          {/* Error Routes & Catch-all (Rendered within AppShell right viewport, keeping left sidebar intact) */}
          <Route path="/403" element={<NotAllowedPage />} />
          <Route path="/404" element={<NotFound404Page />} />
          <Route path="*" element={<NotFound404Page />} />
        </Routes>
        </Suspense>
      </AppShell>
    </AuthGuard>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <SidebarProvider>
              <Suspense fallback={<PageLoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/*" element={<ProtectedLayout />} />
                </Routes>
              </Suspense>
            </SidebarProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
