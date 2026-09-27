/**
 * Standard user authorization roles across SignTrustMap Web and Ops ecosystems.
 * - `driver`: End-user mobile/web reporter on the road.
 * - `surveyor`: Field data collector submitting high-volume photo telemetry.
 * - `reviewer`: Community validator approving or rejecting submissions.
 * - `staff`: Internal operations specialist managing catalog and disputes.
 * - `admin`: System administrator with full governance and configuration access.
 */
export type UserRole = 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin'

/**
 * Convenient alias for UserRole.
 */
export type Role = UserRole

/**
 * Core User profile model returned from authentication and session endpoints.
 */
export interface User {
  /** Unique user identifier (UUID or standard ID). */
  id: string
  /** Full display name. */
  name: string
  /** Primary contact and login email address. */
  email: string
  /** Contact phone number. */
  phone?: string
  /** Access level and permission scope. */
  role: UserRole
  /** Optional CDN avatar image URL. */
  avatar?: string
  /** Initials abbreviation used when avatar is absent (e.g. "NL"). */
  initials?: string
  /** ISO date string or formatted date when the account joined. */
  joinDate?: string
  /** Optional password field for local demo environments. */
  password?: string
  /** Accumulated reward credits in gamified contribution economy. */
  credits?: number
  /** Historical reliability score (0-100%) computed by validation consensus. */
  trustScore?: number
}

/**
 * Global authentication state maintained by AuthContext in applications.
 */
export interface AuthState {
  /** Authenticated user profile, or `null` if unauthenticated. */
  user: User | null
  /** Active JSON Web Token (Bearer token) for authenticated API requests. */
  token?: string | null
  /** Refresh token used for silent session renewal. */
  refreshToken?: string | null
  /** Flag indicating whether a verified active session exists. */
  isAuthenticated: boolean
  /** Flag indicating initial session restoration or ongoing login request. */
  isLoading: boolean
}

/**
 * Extended demo user account representation used for preconfigured accounts and testing.
 */
export interface DemoUserAccount {
  id: string
  name: string
  email: string
  phone?: string
  role: string
  avatar: string
  label?: string
  icon?: string
  password?: string
  credits?: number
  trustScore?: number
  totalSubmissions?: number
  validatedCount?: number
  pendingReviewCount?: number
  accuracyRate?: number
  level?: string
  dailyBonusClaimed?: boolean
  /** Indicates whether this account has authorization to enter internal Ops command center. */
  isOpsAuthorized?: boolean
}

/**
 * Payload sent to backend when updating user profile via PATCH /api/v1/auth/me.
 * Corresponds to NestJS UpdateProfileDto.
 */
export interface UpdateProfilePayload {
  /** Full name (maximum 100 characters) */
  fullName?: string
  /** Contact phone number (maximum 20 characters) */
  phone?: string
  /** Public avatar image URL (maximum 500 characters) */
  avatarUrl?: string
}

/**
 * Payload sent to backend when registering a new account.
 * Mapped directly to NestJS RegisterDto.
 */
export interface AuthRegisterPayload {
  email: string
  /** Minimum 8 characters */
  password: string
  /** Full name (maximum 100 characters) */
  fullName: string
  /** Optional phone number (maximum 20 characters) */
  phone?: string
}

/**
 * Payload sent to backend when authenticating existing user.
 * Mapped directly to NestJS LoginDto.
 */
export interface AuthLoginPayload {
  email: string
  password: string
}

/**
 * Successful response returned by NestJS AuthController.register / login.
 */
export interface AuthSuccessResponse {
  user: {
    id: string
    email: string
    fullName: string
    /** Present in login & me, optional in register */
    roles?: string[]
  }
  accessToken: string
}

/**
 * Detailed user profile response returned by GET /api/v1/auth/me.
 */
export interface UserProfileResponse {
  id: string
  email: string
  fullName: string
  phone?: string | null
  avatarUrl?: string | null
  status: 'ACTIVE' | 'SUSPENDED' | 'INACTIVE' | string
  roles: string[]
  walletBalance: number
  profileStats?: {
    driver?: Record<string, any> | null
    surveyor?: Record<string, any> | null
    reviewer?: Record<string, any> | null
  }
}

/**
 * Standard error response structure returned by NestJS.
 */
export interface ApiErrorResponse {
  statusCode: number
  /** Single error message or list of validation messages */
  message: string | string[]
  error?: string
}

/**
 * Normalizes backend uppercase role array into standard frontend UserRole.
 * Hierarchy: admin > staff > reviewer > surveyor > driver
 *
 * @param roles Array of role codes from backend (e.g. ['SURVEYOR', 'REVIEWER'])
 * @returns Primary frontend UserRole
 */
export function normalizeBackendRole(roles?: string[]): UserRole {
  if (!roles || roles.length === 0) return 'driver'
  const normalized = roles.map((r) => r.toUpperCase())
  if (normalized.includes('ADMIN')) return 'admin'
  if (normalized.includes('STAFF')) return 'staff'
  if (normalized.includes('REVIEWER')) return 'reviewer'
  if (normalized.includes('SURVEYOR')) return 'surveyor'
  return 'driver'
}

/**
 * Regex for standard Vietnamese 10-digit mobile phone numbers:
 * Starts with 0 followed by 3, 5, 7, 8, or 9 and 8 digits.
 */
export const VIETNAM_PHONE_REGEX = /^(03|05|07|08|09)\d{8}$/

/**
 * Normalizes phone numbers by stripping whitespace/dots/hyphens and converting +84 or 84 prefix to standard 0.
 *
 * @param phone Raw phone input
 * @returns Clean normalized phone string (e.g. "0912345678")
 */
export function normalizeVietnamPhone(phone: string): string {
  let clean = phone.trim().replace(/[\s.-]/g, '')
  if (clean.startsWith('+84')) {
    clean = '0' + clean.slice(3)
  } else if (clean.startsWith('84') && clean.length === 11) {
    clean = '0' + clean.slice(2)
  }
  return clean
}

/**
 * Validates whether a given string is a valid Vietnamese mobile phone number.
 *
 * @param phone Raw phone string input
 * @returns boolean true if valid, false otherwise
 */
export function isValidVietnamPhone(phone?: string | null): boolean {
  if (!phone) return false
  const clean = normalizeVietnamPhone(phone)
  return VIETNAM_PHONE_REGEX.test(clean)
}

