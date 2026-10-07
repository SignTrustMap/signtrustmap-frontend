import { apiClient, http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface ExportSignsParams {
  format?: 'geojson' | 'json' | string
  status?: string
}

export const exportService = {
  /**
   * Export all verified traffic signs in GeoJSON or JSON format
   * via GET /api/v1/admin/signs/export
   */
  exportSignsData: async (params?: ExportSignsParams): Promise<any> => {
    const format = params?.format || 'geojson'
    const queryParams: Record<string, string> = { format }
    if (params?.status) queryParams.status = params.status

    return http.get<any>(API_ENDPOINTS.EXPORTS.TRIGGER, { params: queryParams })
  },

  /**
   * Helper to download the export file directly to client computer
   */
  downloadExportFile: async (format: 'geojson' | 'json' = 'geojson', status?: string): Promise<void> => {
    const url = API_ENDPOINTS.EXPORTS.SIGNS(format, status)
    const response = await apiClient.get(url, { responseType: 'blob' })
    const blob = new Blob([response as any], {
      type: format === 'geojson' ? 'application/geo+json' : 'application/json',
    })
    const downloadUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = downloadUrl
    const timestamp = new Date().toISOString().slice(0, 10)
    link.download = `signtrustmap_export_${timestamp}.${format === 'geojson' ? 'geojson' : 'json'}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(downloadUrl)
  },

  // Backwards compatibility wrappers
  getExportHistory: async (): Promise<any> => {
    return []
  },
  generateExport: async (data: any): Promise<any> => {
    return exportService.exportSignsData({ format: data.format || 'geojson' })
  },
}

export const ExportService = exportService
