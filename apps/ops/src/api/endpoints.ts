/**
 * Centralized API Endpoints registry for SignTrustMap Ops & Admin workspace
 */

/**
 * Base URL for the Jetson Orin Edge AI Node runtime (AIOps).
 * Pulled dynamically from environment variables (VITE_AIOPS_EDGE_URL) with fallback.
 */
export const AIOPS_BASE_URL: string = (
  import.meta.env.VITE_AIOPS_EDGE_URL || 'https://drum-valid-randomly.ngrok-free.app'
).replace(/\/$/, '')

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
  },
  USERS: {
    BASE: '/api/v1/users',
    DETAIL: (userId: string) => `/api/v1/users/${userId}`,
    UPDATE_ROLE: (userId: string) => `/api/v1/users/${userId}/role`,
    TOGGLE_STATUS: (userId: string) => `/api/v1/users/${userId}/status`,
  },
  ROLES: {
    BASE: '/api/v1/roles',
    DETAIL: (roleId: string) => `/api/v1/roles/${roleId}`,
    UPDATE_PERMISSIONS: (roleId: string) => `/api/v1/roles/${roleId}/permissions`,
  },
  CATALOG: {
    BASE: '/api/v1/catalog',
    DETAIL: (code: string) => `/api/v1/catalog/${code}`,
    PUBLISH_VERSION: '/api/v1/catalog/publish-version',
    SYNC_EMBEDDINGS: '/api/v1/catalog/sync-embeddings',
    MISSING_REPORTS: {
      BASE: '/api/v1/catalog/missing-reports',
      DETAIL: (id: string) => `/api/v1/catalog/missing-reports/${id}`,
      APPROVE: (id: string) => `/api/v1/catalog/missing-reports/${id}/approve`,
      MERGE: (id: string) => `/api/v1/catalog/missing-reports/${id}/merge`,
    },
  },
  SPATIAL: {
    SIGNS: '/api/v1/spatial/signs',
    SIGN_DETAIL: (id: string) => `/api/v1/spatial/signs/${id}`,
    OVERRIDE: (id: string) => `/api/v1/spatial/signs/${id}/override`,
    DELETE_MALICIOUS: (id: string) => `/api/v1/spatial/signs/${id}`,
  },
  ESCALATIONS: {
    BASE: '/api/v1/escalations',
    DETAIL: (caseId: string) => `/api/v1/escalations/${caseId}`,
    RESOLVE: (caseId: string) => `/api/v1/escalations/${caseId}/resolve`,
  },
  ECONOMY: {
    RULES: '/api/v1/economy/rules',
    TOPUP_PACKAGES: '/api/v1/economy/topup-packages',
    CREDITS_APPROVAL: {
      BASE: '/api/v1/economy/credits/approvals',
      DECISION: (id: string) => `/api/v1/economy/credits/approvals/${id}/decision`,
    },
  },
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
  EXPORTS: {
    TRIGGER: '/api/v1/spatial/exports/generate',
    HISTORY: '/api/v1/spatial/exports/history',
    DOWNLOAD: (jobId: string) => `/api/v1/spatial/exports/${jobId}/download`,
  },
  SETTINGS: {
    BASE: '/api/v1/system/settings',
    INGESTION: '/api/v1/system/settings/ingestion',
    CONSENSUS: '/api/v1/system/settings/consensus',
    FRESHNESS: '/api/v1/system/settings/freshness',
    MODERATION: '/api/v1/system/settings/moderation',
    MAINTENANCE: '/api/v1/system/settings/maintenance-mode',
  },
  AUDIT: {
    LOGS: '/api/v1/audit/logs',
  },
  MODERATION: {
    CANDIDATES: '/api/v1/moderation/candidates',
    CANDIDATE_DETAIL: (id: string) => `/api/v1/moderation/candidates/${id}`,
    DECISION: (id: string) => `/api/v1/moderation/candidates/${id}/decision`,
    REPORTS: '/api/v1/moderation/reports',
    TASKS: '/api/v1/moderation/tasks',
  },
} as const
