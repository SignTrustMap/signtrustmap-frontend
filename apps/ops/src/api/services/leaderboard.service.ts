import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface LeaderboardContributor {
  rank: number
  userId: string
  fullName: string
  avatarUrl?: string | null
  totalVerifiedSigns: number
  totalReviews: number
  accuracyRate: number
  totalCreditsEarned: number
}

export interface PaginatedLeaderboardResponse {
  items: LeaderboardContributor[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export const leaderboardService = {
  /**
   * Get contributor rankings
   */
  getLeaderboard: async (page = 1, pageSize = 20): Promise<PaginatedLeaderboardResponse> => {
    return http.get<PaginatedLeaderboardResponse>(API_ENDPOINTS.LEADERBOARD.BASE, {
      params: { page, pageSize },
    })
  },

  /**
   * Admin triggers refresh of contributor leaderboard materialized view cache
   */
  refreshLeaderboard: async (): Promise<{ refreshed: boolean; timestamp: string }> => {
    return http.post<{ refreshed: boolean; timestamp: string }>(API_ENDPOINTS.LEADERBOARD.REFRESH)
  },
}

export const LeaderboardService = leaderboardService
