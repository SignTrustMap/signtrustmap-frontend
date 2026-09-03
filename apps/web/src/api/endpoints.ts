/**
 * Centralized API Endpoints registry for SignTrustMap Web Application
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    LOGOUT: '/api/v1/auth/logout',
    ME: '/api/v1/auth/me',
    REFRESH_TOKEN: '/api/v1/auth/refresh-token',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    RESET_PASSWORD: '/api/v1/auth/reset-password',
  },
  USER: {
    PROFILE: '/api/v1/users/profile',
    UPDATE_PROFILE: '/api/v1/users/profile',
    STATS: '/api/v1/users/stats',
  },
  SIGNS: {
    MAP: '/api/v1/spatial/signs',
    DETAIL: (id: string) => `/api/v1/spatial/signs/${id}`,
    NEARBY: '/api/v1/spatial/signs/nearby',
    REPORT_ISSUE: (id: string) => `/api/v1/spatial/signs/${id}/report`,
  },
  CATALOG: {
    BASE: '/api/v1/catalog',
    DETAIL: (code: string) => `/api/v1/catalog/${code}`,
    PROPOSE_NEW: '/api/v1/catalog/missing-reports',
  },
  SURVEY: {
    UPLOAD_VIDEO: '/api/v1/surveys/upload/video',
    UPLOAD_PHOTO: '/api/v1/surveys/upload/photo',
    UPLOAD_GPX: '/api/v1/surveys/upload/gpx',
    SUBMISSIONS: '/api/v1/surveys/submissions',
    SUBMISSION_DETAIL: (id: string) => `/api/v1/surveys/submissions/${id}`,
  },
  WALLET: {
    BALANCE: '/api/v1/economy/wallet/balance',
    TRANSACTIONS: '/api/v1/economy/wallet/transactions',
    TOPUP_PACKAGES: '/api/v1/economy/topup-packages',
    CREATE_PAYMENT: '/api/v1/economy/wallet/topup',
    REWARDS_CLAIM: '/api/v1/economy/rewards/daily-claim',
  },
  TASKS: {
    REVALIDATION_LIST: '/api/v1/tasks/revalidations',
    SUBMIT_VOTE: (taskId: string) => `/api/v1/tasks/revalidations/${taskId}/vote`,
  },
} as const
