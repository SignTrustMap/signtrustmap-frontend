import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { SpatialSignRecord } from '@/data/adminGovernanceData'

export interface OverrideSpatialSignDto {
  lat: number
  lng: number
  headingDeg: number
  reason: string
}

export class SpatialService {
  /**
   * Fetch verified road signs for GIS map and tabular inspection
   */
  static async getSpatialSigns(params?: { city?: string; category?: string }): Promise<ApiResponse<SpatialSignRecord[]>> {
    return http.get<ApiResponse<SpatialSignRecord[]>>(API_ENDPOINTS.SPATIAL.SIGNS, { params })
  }

  /**
   * Perform administrative spatial override (coordinates / heading / bearing)
   */
  static async overrideSign(signId: string, data: OverrideSpatialSignDto): Promise<ApiResponse<SpatialSignRecord>> {
    return http.put<ApiResponse<SpatialSignRecord>>(API_ENDPOINTS.SPATIAL.OVERRIDE(signId), data)
  }

  /**
   * Delete or flag a malicious GPS sign record
   */
  static async deleteMaliciousSign(signId: string, reason: string): Promise<ApiResponse<{ deleted: boolean }>> {
    return http.delete<ApiResponse<{ deleted: boolean }>>(API_ENDPOINTS.SPATIAL.DELETE_MALICIOUS(signId), {
      data: { reason },
    })
  }
}
