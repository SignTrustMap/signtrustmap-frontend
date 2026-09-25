export type UserRole = 'driver' | 'surveyor' | 'reviewer' | 'staff' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  avatar?: string
  initials?: string
  credits?: number
  trustScore?: number
}

export interface AuthState {
  user: User | null
  token?: string | null
  refreshToken?: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

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
  isOpsAuthorized?: boolean
}
