import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ThemeProvider } from '@/context/ThemeContext'
import { ToastProvider } from '@/context/ToastContext'
import { SidebarProvider } from '@/context/SidebarContext'
import { AppShell } from '@/components/layout/AppShell'
import {
  AuthProvider,
  AuthGuard,
  AdminGuard,
  StaffGuard,
  LoginPage,
  NotAllowedPage,
  DashboardPage,
  UsersPage,
  RolesPage,
  CatalogPage,
  MissingSignsPage,
  SpatialOverridesPage,
  AdminEscalationsPage,
  CreditRulesPage,
  CreditsApprovalPage,
  AiopsPage,
  SpatialDataExportPage,
  SystemSettingsPage,
  AuditLogsPage,
  CandidatesListPage,
  CandidateDetailPage,
  MapPage,
  TasksPage,
  ReportsPage,
} from '@/features'

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
          <Route path="/catalog/new-types" element={<MissingSignsPage />} />
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
        <ToastProvider>
          <AuthProvider>
            <SidebarProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/403" element={<NotAllowedPage />} />
                <Route path="/*" element={<ProtectedLayout />} />
              </Routes>
            </SidebarProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
