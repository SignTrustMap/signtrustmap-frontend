// User roles in the ops portal
export type Role = 'staff' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  avatar?: string
}

export interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}
