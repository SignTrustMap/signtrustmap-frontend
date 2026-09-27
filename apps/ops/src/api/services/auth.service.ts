import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  AuthLoginPayload,
  AuthSuccessResponse,
  UserProfileResponse,
} from '@shared/types'

/**
 * Functional service object managing authentication and user session calls for Ops Portal.
 * Adheres to RULE.md Section 6.5 (Functional Service Objects, Zero static class).
 */
export const authService = {
  /**
   * Authenticate user with email and password via NestJS backend
   * @param payload Credentials (email, password)
   * @returns AuthSuccessResponse containing user and JWT accessToken
   */
  login: (payload: AuthLoginPayload): Promise<AuthSuccessResponse> => {
    return http.post<AuthSuccessResponse>(API_ENDPOINTS.AUTH.LOGIN, payload)
  },

  /**
   * Retrieve currently authenticated user profile with roles
   * Requires Bearer token
   */
  getMe: (): Promise<UserProfileResponse> => {
    return http.get<UserProfileResponse>(API_ENDPOINTS.AUTH.ME)
  },

  /**
   * Perform client-side logout and purge stored credentials
   */
  logout: () => {
    localStorage.removeItem('stm_access_token')
    localStorage.removeItem('stm_refresh_token')
    localStorage.removeItem('stm_ops_user')
  },
}
