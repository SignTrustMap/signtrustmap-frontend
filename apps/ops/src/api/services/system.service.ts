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

export const systemService = {
  /**
   * Fetch all technical system configuration parameters
   */
  getSettings: async (): Promise<ApiResponse<SystemSettingsConfig>> => {
    return http.get<ApiResponse<SystemSettingsConfig>>(API_ENDPOINTS.SETTINGS.BASE)
  },

  /**
   * Update full or partial system settings
   */
  updateSettings: async (data: Partial<SystemSettingsConfig>): Promise<ApiResponse<SystemSettingsConfig>> => {
    return http.put<ApiResponse<SystemSettingsConfig>>(API_ENDPOINTS.SETTINGS.BASE, data)
  },

  /**
   * Toggle global maintenance mode
   */
  toggleMaintenance: async (enabled: boolean): Promise<ApiResponse<{ maintenanceMode: boolean }>> => {
    return http.post<ApiResponse<{ maintenanceMode: boolean }>>(API_ENDPOINTS.SETTINGS.MAINTENANCE, { enabled })
  },
}

export const SystemService = systemService
