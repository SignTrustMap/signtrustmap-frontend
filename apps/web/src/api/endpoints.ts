/**
 * Centralized API Endpoints registry for SignTrustMap Web Application
 */

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    ME: '/api/v1/auth/me',
    GOOGLE: '/api/v1/auth/google',
    GOOGLE_CALLBACK: '/api/v1/auth/google/callback',
    FORGOT_PASSWORD: '/api/v1/auth/forgot-password',
    VERIFY_OTP: '/api/v1/auth/verify-otp',
    RESEND_OTP: '/api/v1/auth/resend-otp',
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
  SUBMISSIONS: {
    BASE: '/api/v1/submissions',
    ME: '/api/v1/submissions/me',
    STATUS: (id: string) => `/api/v1/submissions/status/${encodeURIComponent(id)}`,
    PENDING: '/api/v1/submissions/me/pending',
    STATS: '/api/v1/submissions/me/stats',
    UPLOADS: (id: string) => `/api/v1/submissions/${encodeURIComponent(id)}/uploads`,
    CHUNKS: (sessionId: string) => `/api/v1/submissions/uploads/${encodeURIComponent(sessionId)}/chunks`,
    COMPLETE: (sessionId: string) => `/api/v1/submissions/uploads/${encodeURIComponent(sessionId)}/complete`,
    SUBMIT: (id: string) => `/api/v1/submissions/${encodeURIComponent(id)}/submit`,
    DETAIL: (id: string) => `/api/v1/submissions/${encodeURIComponent(id)}`,
  },
  REVIEWS: {
    QUEUE: '/api/v1/reviews/queue',
    VOTE: (candidateId: string) => `/api/v1/reviews/${encodeURIComponent(candidateId)}/vote`,
    SKIP: (candidateId: string) => `/api/v1/reviews/candidates/${encodeURIComponent(candidateId)}/skip`,
    REPORT: (candidateId: string) => `/api/v1/reviews/candidates/${encodeURIComponent(candidateId)}/report`,
    CAN_NOT_IDENTIFY: (candidateId: string) => `/api/v1/reviews/candidates/${encodeURIComponent(candidateId)}/can-not-identify`,
    CANDIDATE_DETAIL: (candidateId: string) => `/api/v1/reviews/candidates/${encodeURIComponent(candidateId)}`,
    STATS: '/api/v1/reviews/me/stats',
    HISTORY: '/api/v1/reviews/me/history',
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
} as const
