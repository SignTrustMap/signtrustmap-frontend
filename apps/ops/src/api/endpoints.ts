/**
 * Centralized API Endpoints registry for SignTrustMap Ops & Admin workspace
 * Fully aligned with NestJS Backend (apps/nestjs) and global prefix /api/v1
 */

import { env } from '@/config/env'

/**
 * Base URL for the Jetson Orin Edge AI Node runtime (AIOps).
 * Pulled dynamically from centralized env configuration.
 */
export const AIOPS_BASE_URL: string = env.aiopsEdgeUrl.replace(/\/$/, '')

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
    VERIFY_OTP: '/api/v1/auth/verify-otp',
  },

  // ── Admin Identity & User Management ──────────────────────────────
  USERS: {
    BASE: '/api/v1/admin/users',
    DETAIL: (userId: string) => `/api/v1/admin/users/${userId}`,
    UPDATE_ROLE: (userId: string) => `/api/v1/admin/users/${userId}/roles`,
    ASSIGN_ROLE: (userId: string) => `/api/v1/admin/users/${userId}/roles`,
    TOGGLE_STATUS: (userId: string) => `/api/v1/admin/users/${userId}/status`,
    UPDATE_STATUS: (userId: string) => `/api/v1/admin/users/${userId}/status`,
  },

  ROLES: {
    BASE: '/api/v1/roles',
    DETAIL: (roleId: string) => `/api/v1/roles/${roleId}`,
    UPDATE_PERMISSIONS: (roleId: string) => `/api/v1/roles/${roleId}/permissions`,
  },

  // ── Security & Audit Logs ─────────────────────────────────────────
  AUDIT: {
    LOGS: '/api/v1/admin/audit-logs',
  },

  // ── GIS Spatial Data Export ───────────────────────────────────────
  EXPORTS: {
    SIGNS: (format: string = 'geojson', status?: string) =>
      `/api/v1/admin/signs/export?format=${encodeURIComponent(format)}${status ? `&status=${encodeURIComponent(status)}` : ''}`,
    TRIGGER: '/api/v1/admin/signs/export',
    HISTORY: '/api/v1/admin/signs/export',
    DOWNLOAD: (jobId: string) => `/api/v1/spatial/exports/${jobId}/download`,
  },

  // ── Traffic Sign Catalog Governance ───────────────────────────────
  CATALOG: {
    BASE: '/api/v1/catalog/sign-types',
    SIGN_TYPES: '/api/v1/catalog/sign-types',
    SIGN_TYPE_DETAIL: (id: number | string) => `/api/v1/catalog/sign-types/${id}`,
    CATEGORIES: '/api/v1/catalog/categories',
    CATEGORY_DETAIL: (id: number | string) => `/api/v1/catalog/categories/${id}`,
    SUPPORT_SHOTS: (signTypeId: number | string) => `/api/v1/catalog/sign-types/${signTypeId}/support-shots`,
    SUPPORT_SHOT_DETAIL: (signTypeId: number | string, imageId: string) =>
      `/api/v1/catalog/sign-types/${signTypeId}/support-shots/${imageId}`,
    SUPPORT_SHOT_PIN: (signTypeId: number | string, imageId: string) =>
      `/api/v1/catalog/sign-types/${signTypeId}/support-shots/${imageId}/pin`,
    REBUILD_PROTOTYPES: '/api/v1/catalog/rebuild-prototypes',
    PUBLISH_VERSION: '/api/v1/catalog/publish-version',
    SYNC_EMBEDDINGS: '/api/v1/catalog/sync-embeddings',
    MISSING_REPORTS: {
      BASE: '/api/v1/moderation/missing-type-reports',
      DETAIL: (id: string) => `/api/v1/moderation/missing-type-reports/${id}`,
      APPROVE: (id: string) => `/api/v1/moderation/missing-type-reports/${id}/approve-and-create-type`,
      MERGE: (id: string) => `/api/v1/moderation/missing-type-reports/${id}`,
    },
  },

  // ── Moderation, Disputes & Missing Type Reports ───────────────────
  MODERATION: {
    MISSING_TYPE_REPORTS: '/api/v1/moderation/missing-type-reports',
    MISSING_TYPE_REPORT_DETAIL: (id: string) => `/api/v1/moderation/missing-type-reports/${id}`,
    APPROVE_AND_CREATE_TYPE: (id: string) => `/api/v1/moderation/missing-type-reports/${id}/approve-and-create-type`,
    CASES: '/api/v1/moderation/cases',
    CASE_DETAIL: (id: string) => `/api/v1/moderation/cases/${id}`,
    RESOLVE_CASE: (id: string) => `/api/v1/moderation/cases/${id}/resolve`,
    REPORT_FROM_REVIEW: '/api/v1/reviews/missing-type',
    CANDIDATES: '/api/v1/reviews/queue',
    CANDIDATE_DETAIL: (id: string) => `/api/v1/reviews/candidates/${id}`,
    DECISION: (id: string) => `/api/v1/reviews/${id}/vote`,
    REPORTS: '/api/v1/moderation/cases',
    TASKS: '/api/v1/revalidation/tasks',
  },

  ESCALATIONS: {
    BASE: '/api/v1/moderation/cases',
    DETAIL: (caseId: string) => `/api/v1/moderation/cases/${caseId}`,
    RESOLVE: (caseId: string) => `/api/v1/moderation/cases/${caseId}/resolve`,
  },

  // ── System Configuration (Parameters, Consensus, Route Matrix) ───
  SETTINGS: {
    SYSTEM_PARAMETERS: '/api/v1/admin/system-parameters',
    SYSTEM_PARAMETER_KEY: (key: string) => `/api/v1/admin/system-parameters/${encodeURIComponent(key)}`,
    CONSENSUS_CONFIG: '/api/v1/admin/consensus/config',
    ROUTE_MATRIX: '/api/v1/admin/routes/matrix',
    ROUTE_MATRIX_DETAIL: (id: number | string) => `/api/v1/admin/routes/matrix/${id}`,
    BASE: '/api/v1/admin/system-parameters',
    INGESTION: '/api/v1/admin/system-parameters',
    CONSENSUS: '/api/v1/admin/consensus/config',
    FRESHNESS: '/api/v1/admin/routes/matrix',
    MODERATION: '/api/v1/admin/system-parameters',
    MAINTENANCE: '/api/v1/admin/system-parameters/maintenance_mode',
  },

  // ── Economy, Rewards & Wallet Adjustments ─────────────────────────
  ECONOMY: {
    RULES: '/api/v1/admin/rewards/rules',
    RULE_DETAIL: (id: number | string) => `/api/v1/admin/rewards/rules/${id}`,
    RULE_TOGGLE: (id: number | string) => `/api/v1/admin/rewards/rules/${id}/toggle`,
    WALLET_ADJUST: (id: string) => `/api/v1/admin/wallets/${id}/adjust`,
    WALLET_FREEZE: (id: string) => `/api/v1/admin/wallets/${id}/freeze`,
    TOPUP_PACKAGES: '/api/v1/payments/packages',
    CREDITS_APPROVAL: {
      BASE: '/api/v1/admin/wallets',
      DECISION: (id: string) => `/api/v1/admin/wallets/${id}/adjust`,
    },
  },

  // ── Verified Signs & Spatial Administration ───────────────────────
  SIGNS: {
    BASE: '/api/v1/signs',
    MAP: '/api/v1/signs',
    DETAIL: (id: string) => `/api/v1/signs/${id}`,
    ALONG_ROUTE: '/api/v1/signs/along-route',
    CONFIRM: (id: string) => `/api/v1/signs/${id}/confirm`,
    NEARBY: '/api/v1/signs',
    REPORT_ISSUE: (id: string) => `/api/v1/signs/${id}/confirm`,
  },

  SPATIAL: {
    SIGNS: '/api/v1/signs',
    SIGN_DETAIL: (id: string) => `/api/v1/signs/${id}`,
    OVERRIDE: (id: string) => `/api/v1/signs/${id}`,
    DELETE_MALICIOUS: (id: string) => `/api/v1/signs/${id}`,
    RESOLVE: '/api/v1/spatial/resolve',
    SEARCH: '/api/v1/spatial/search',
    BACKFILL: '/api/v1/spatial/backfill',
  },

  // ── Revalidation Field Tasks & Evidence Verification ──────────────
  REVALIDATION: {
    TASKS: '/api/v1/revalidation/tasks',
    TASK_DETAIL: (id: string) => `/api/v1/revalidation/tasks/${id}`,
    TASK_MAP: '/api/v1/revalidation/tasks/map',
    TASK_EVIDENCES: (id: string) => `/api/v1/revalidation/tasks/${id}/evidences`,
    TASK_FINALIZE: (taskId: string) => `/api/v1/revalidation/tasks/${taskId}/finalize`,
    EVIDENCE_VOTE: (evidenceId: string) => `/api/v1/revalidation/evidence/${evidenceId}/vote`,
    EVIDENCE_QUEUE: '/api/v1/revalidation/evidence/queue',
    EVIDENCE_DECISIONS: (evidenceId: string) => `/api/v1/revalidation/evidence/${evidenceId}/decisions`,
  },

  // ── Contributor Leaderboard ───────────────────────────────────────
  LEADERBOARD: {
    BASE: '/api/v1/leaderboard',
    REFRESH: '/api/v1/leaderboard/refresh',
  },

  // ── Navigation & GIS Routing ──────────────────────────────────────
  NAVIGATION: {
    ROUTING_DIRECTIONS: '/api/v1/routing/directions',
    VEHICLE_MODES: '/api/v1/routing/vehicle-modes',
    SIGNS_ALONG_ROUTE: '/api/v1/signs/along-route',
    SIGNS_IN_BOUNDS: '/api/v1/signs',
    ADDRESS_SEARCH: '/api/v1/addresses/search',
    SAVED_PLACES: '/api/v1/places/saved',
    RECENT_SEARCHES: '/api/v1/places/recent-searches',
    RECENT_SEARCH_DETAIL: (id: string) => `/api/v1/places/recent-searches/${id}`,
  },

  // ── AIOps & Edge AI Pipelines ─────────────────────────────────────
  AIOPS: {
    BASE: AIOPS_BASE_URL,
    HEALTH: `${AIOPS_BASE_URL}/api/v1/system/health`,
    STREAM: `${AIOPS_BASE_URL}/api/v1/system/stream`,
    MODELS: `${AIOPS_BASE_URL}/api/v1/models`,
    STRATEGIES: `${AIOPS_BASE_URL}/api/v1/active-learning/strategies`,
    CLASSES: `${AIOPS_BASE_URL}/api/v1/classes`,
    CONFIG: `${AIOPS_BASE_URL}/api/v1/config`,
    PIPELINE_STATUS: '/api/v1/mlops/pipeline/status',
    RETRAINING_RUNS: '/api/v1/mlops/retraining-runs',
    TRIGGER_RUN: '/api/v1/mlops/retraining-runs/trigger',
    ACTIVE_LEARNING_CONFIG: '/api/v1/mlops/active-learning/config',
  },
} as const
