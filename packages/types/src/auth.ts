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
