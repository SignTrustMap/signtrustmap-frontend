import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { ExportHistoryRecord } from '@/data/adminGovernanceData'

export interface GenerateExportDto {
  city: string
  category: string
  format: 'geojson' | 'shapefile' | 'csv' | 'osm'
  includeConfidence?: boolean
}

export class ExportService {
  /**
   * Fetch previous spatial export jobs
   */
  static async getExportHistory(): Promise<ApiResponse<ExportHistoryRecord[]>> {
    return http.get<ApiResponse<ExportHistoryRecord[]>>(API_ENDPOINTS.EXPORTS.HISTORY)
  }

  /**
   * Request a new spatial data export bundle
   */
  static async generateExport(data: GenerateExportDto): Promise<ApiResponse<ExportHistoryRecord>> {
    return http.post<ApiResponse<ExportHistoryRecord>>(API_ENDPOINTS.EXPORTS.TRIGGER, data)
  }
}
