import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface LoginPayload {
  email: string
  password?: string
}

export interface RegisterPayload {
  email: string
  name: string
  password?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  user: {
    id: string
    name: string
    email: string
    role: string
    avatar?: string
  }
}

export const authService = {
  /**
   * Log in user
   */
  login: (payload: LoginPayload) => {
    return http.post<ApiResponse<AuthResponse>>(API_ENDPOINTS.AUTH.LOGIN, payload)
  },

  /**
   * Register a new community account
   */
  register: (payload: RegisterPayload) => {
    return http.post<ApiResponse<AuthResponse>>(API_ENDPOINTS.AUTH.REGISTER, payload)
  },

  /**
   * Fetch current authenticated user profile
   */
  getMe: () => {
    return http.get<ApiResponse<AuthResponse['user']>>(API_ENDPOINTS.AUTH.ME)
  },

  /**
   * Sign out and invalidate token
   */
  logout: () => {
    return http.post<ApiResponse<{ message: string }>>(API_ENDPOINTS.AUTH.LOGOUT)
  },
}
