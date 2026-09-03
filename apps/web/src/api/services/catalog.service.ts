import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface CatalogSignEntry {
  code: string
  name: string
  category: string
  meaning?: string
  shape?: string
  color?: string
  svgIcon?: string
}

export const catalogService = {
  /**
   * Fetch all recognized traffic signs from catalog
   */
  getCatalog: (category?: string) => {
    return http.get<ApiResponse<CatalogSignEntry[]>>(API_ENDPOINTS.CATALOG.BASE, {
      params: { category },
    })
  },

  /**
   * Get specific sign specification by code
   */
  getSignByCode: (code: string) => {
    return http.get<ApiResponse<CatalogSignEntry>>(API_ENDPOINTS.CATALOG.DETAIL(code))
  },

  /**
   * Submit a new sign proposal when a sign is missing from standard catalog
   */
  proposeNewSign: (payload: { tempName: string; category: string; description: string; imageFile: File | string; lat?: number; lng?: number }) => {
    return http.post<ApiResponse<{ proposalId: string }>>(API_ENDPOINTS.CATALOG.PROPOSE_NEW, payload)
  },
}
