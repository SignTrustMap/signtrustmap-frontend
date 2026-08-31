import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface SystemSettingsConfig {
  maxVideoSizeMb: number
  chunkSizeMb: number
  workerConcurrency: number
  consensusApprovalThreshold: number
  minReviewerVotes: number
  alphaSmoothingFactor: number
  reliabilityPenalty: number
  freshnessThresholdDays: number
  maxDailyTasksPerUser: number
  autoEscalateTieVotes: boolean
  gpsAnomalySpeedLimitKmh: number
  maintenanceMode: boolean
}

export class SystemService {
  /**
   * Fetch all technical system configuration parameters
   */
  static async getSettings(): Promise<ApiResponse<SystemSettingsConfig>> {
    return http.get<ApiResponse<SystemSettingsConfig>>(API_ENDPOINTS.SETTINGS.BASE)
  }

  /**
   * Update full or partial system settings
   */
  static async updateSettings(data: Partial<SystemSettingsConfig>): Promise<ApiResponse<SystemSettingsConfig>> {
    return http.put<ApiResponse<SystemSettingsConfig>>(API_ENDPOINTS.SETTINGS.BASE, data)
  }

  /**
   * Toggle global maintenance mode
   */
  static async toggleMaintenance(enabled: boolean): Promise<ApiResponse<{ maintenanceMode: boolean }>> {
    return http.post<ApiResponse<{ maintenanceMode: boolean }>>(API_ENDPOINTS.SETTINGS.MAINTENANCE, { enabled })
  }
}
