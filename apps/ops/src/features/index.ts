// apps/ops/src/features/index.ts
// Single entrypoint re-exporting all operational pages & feature modules

// Overview
export { default as DashboardPage } from './dashboard/DashboardPage'

// Identity & Access
export { default as UsersPage } from './users/UsersPage'
export { default as RolesPage } from './roles/RolesPage'

// Traffic Sign Governance
export { default as CatalogPage } from './catalog/CatalogPage'
export { default as MissingSignsPage } from './catalog/MissingSignsPage'
export { default as SpatialOverridesPage } from './spatial/SpatialOverridesPage'
export { default as AdminEscalationsPage } from './escalations/AdminEscalationsPage'

// Economy
export { default as CreditRulesPage } from './economy/CreditRulesPage'
export { default as CreditsApprovalPage } from './credits/CreditsApprovalPage'

// AI Pipeline & AIOps
export { default as AiopsPage } from './aiops/AiopsPage'

// Data Export
export { default as SpatialDataExportPage } from './exports/SpatialDataExportPage'

// System Configuration & Audit
export { default as SystemSettingsPage } from './settings/SystemSettingsPage'
export { default as AuditLogsPage } from './audit/AuditLogsPage'

// Staff Operations
export { default as CandidatesListPage } from './candidates/CandidatesListPage'
export { default as CandidateDetailPage } from './candidates/CandidateDetailPage'
export { default as MapPage } from './map/MapPage'
export { default as TasksPage } from './tasks/TasksPage'
export { default as StaffDirectoryPage } from './staff/StaffDirectoryPage'
export { default as StaffDetailPage } from './staff/StaffDetailPage'
export { default as ReportsPage } from './reports/ReportsPage'

// Authentication & Access Control
export { default as LoginPage } from './auth/LoginPage'
export { default as NotAllowedPage } from './auth/NotAllowedPage'
export * from './auth/Guards'
export * from './auth/AuthContext'
