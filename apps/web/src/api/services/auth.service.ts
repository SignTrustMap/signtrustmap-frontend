import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  AuthLoginPayload,
  AuthRegisterPayload,
  AuthSuccessResponse,
  UserProfileResponse,
  UpdateProfilePayload,
} from '@shared/types'

export type {
  AuthLoginPayload,
  AuthRegisterPayload,
  AuthSuccessResponse,
  UserProfileResponse,
  UpdateProfilePayload,
}

/**
 * Functional service object managing authentication and user session calls.
 * Adheres to RULE.md Section 6.5 (Functional Service Objects, Zero static class).
 */
export const authService = {
  /**
   * Authenticate user with email and password
   * @param payload Credentials
   * @returns AuthSuccessResponse containing user and accessToken
   */
  login: (payload: AuthLoginPayload): Promise<AuthSuccessResponse> => {
    return http.post<AuthSuccessResponse>(API_ENDPOINTS.AUTH.LOGIN, payload)
  },

  /**
   * Register a new surveyor / driver account
   * @param payload Registration details (fullName, email, password, optional phone)
   * @returns AuthSuccessResponse containing user and accessToken
   */
  register: (payload: AuthRegisterPayload): Promise<AuthSuccessResponse> => {
    return http.post<AuthSuccessResponse>(API_ENDPOINTS.AUTH.REGISTER, payload)
  },

  /**
   * Retrieve currently authenticated user profile with wallet balance and roles
   * Requires Bearer token
   */
  getMe: (): Promise<UserProfileResponse> => {
    return http.get<UserProfileResponse>(API_ENDPOINTS.AUTH.ME)
  },

  /**
   * Update profile information of the authenticated user
   * Corresponds to PATCH /api/v1/auth/me
   * @param payload Profile changes (fullName, phone, avatarUrl)
   */
  updateMe: (payload: UpdateProfilePayload): Promise<UserProfileResponse> => {
    return http.patch<UserProfileResponse>(API_ENDPOINTS.AUTH.ME, payload)
  },

  /**
   * Authenticate or auto-register using Google ID Token
   * @param token Google ID Token (JWT)
   */
  googleTokenLogin: (token: string): Promise<AuthSuccessResponse> => {
    return http.post<AuthSuccessResponse>(API_ENDPOINTS.AUTH.GOOGLE, { token })
  },

  /**
   * Request password reset OTP code sent to registered email
   */
  forgotPassword: (email: string): Promise<{ message?: string }> => {
    return http.post<{ message?: string }>(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, { email })
  },

  /**
   * Validate OTP code
   */
  verifyOtp: (email: string, otp: string): Promise<{ message?: string }> => {
    return http.post<{ message?: string }>(API_ENDPOINTS.AUTH.VERIFY_OTP, { email, otp })
  },

  /**
   * Reset password with validated OTP code
   */
  resetPassword: (payload: { email: string; otp: string; newPassword: string }): Promise<{ message?: string }> => {
    return http.post<{ message?: string }>(API_ENDPOINTS.AUTH.RESET_PASSWORD, payload)
  },

  /**
   * Perform client-side logout and purge stored credentials
   */
  logout: () => {
    localStorage.removeItem('stm_access_token')
    localStorage.removeItem('stm_web_user')
    sessionStorage.removeItem('stm_access_token')
    sessionStorage.removeItem('stm_web_user')
  },
}
