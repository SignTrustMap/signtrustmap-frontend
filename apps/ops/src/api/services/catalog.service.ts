import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { CatalogEntry, MissingSignTypeReport } from '@/data/catalogData'

export interface CreateCatalogSignDto {
  code: string
  name: string
  category: 'prohibition' | 'warning' | 'mandatory' | 'information'
  aiPrompt?: string
  osmMapping?: string
  guidelines?: string
}

export class CatalogService {
  /**
   * Fetch official traffic sign catalog entries
   */
  static async getCatalog(params?: { category?: string; search?: string }): Promise<ApiResponse<CatalogEntry[]>> {
    return http.get<ApiResponse<CatalogEntry[]>>(API_ENDPOINTS.CATALOG.BASE, { params })
  }

  /**
   * Create and publish a new standard sign into the catalog
   */
  static async createSign(data: CreateCatalogSignDto): Promise<ApiResponse<CatalogEntry>> {
    return http.post<ApiResponse<CatalogEntry>>(API_ENDPOINTS.CATALOG.BASE, data)
  }

  /**
   * Fetch pending missing sign reports from field submissions
   */
  static async getMissingSignReports(): Promise<ApiResponse<MissingSignTypeReport[]>> {
    return http.get<ApiResponse<MissingSignTypeReport[]>>(API_ENDPOINTS.CATALOG.MISSING_REPORTS.BASE)
  }

  /**
   * Approve a missing sign proposal to create a new catalog entry
   */
  static async approveMissingReport(reportId: string, data?: { catalogCode?: string }): Promise<ApiResponse<MissingSignTypeReport>> {
    return http.post<ApiResponse<MissingSignTypeReport>>(API_ENDPOINTS.CATALOG.MISSING_REPORTS.APPROVE(reportId), data)
  }

  /**
   * Merge a missing sign proposal into an existing catalog sign
   */
  static async mergeMissingReport(reportId: string, targetCatalogCode: string): Promise<ApiResponse<MissingSignTypeReport>> {
    return http.post<ApiResponse<MissingSignTypeReport>>(API_ENDPOINTS.CATALOG.MISSING_REPORTS.MERGE(reportId), { targetCatalogCode })
  }
}
