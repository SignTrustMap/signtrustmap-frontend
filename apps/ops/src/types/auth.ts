// User roles across SignTrustMap platform
export type Role = 'staff' | 'admin' | 'driver' | 'surveyor' | 'reviewer'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
  initials?: string
  joinDate?: string
  password?: string
  credits?: number
  trustScore?: number
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
