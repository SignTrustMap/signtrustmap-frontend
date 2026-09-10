import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  avatar?: string
  credits: number
  trustScore: number
  totalSubmissions: number
  validatedCount: number
  createdAt: string
}

export const userService = {
  /**
   * Get user profile details
   */
  getProfile: () => {
    return http.get<ApiResponse<UserProfile>>(API_ENDPOINTS.USER.PROFILE)
  },

  /**
   * Update profile information
   */
  updateProfile: (data: Partial<UserProfile>) => {
    return http.put<ApiResponse<UserProfile>>(API_ENDPOINTS.USER.UPDATE_PROFILE, data)
  },

  /**
   * Get contributor statistics
   */
  getStats: () => {
    return http.get<ApiResponse<{ rank: number; weeklyPoints: number; accuracyRate: number }>>(
      API_ENDPOINTS.USER.STATS
    )
  },
}
