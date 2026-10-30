import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface AuditLogRecord {
  id: string
  user_id: string
  action: string
  resource_name?: string
  resource_id?: string
  old_values?: any
  new_values?: any
  ip_address?: string | null
  created_at: string
}

export interface PaginatedAuditLogsResponse {
  items: AuditLogRecord[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListAuditLogsParams {
  action?: string
  resourceName?: string
  userId?: string
  page?: number
  pageSize?: number
}

export const auditService = {
  /**
   * Fetch immutable security audit logs via GET /api/v1/admin/audit-logs
   */
  getAuditLogs: async (params?: ListAuditLogsParams): Promise<PaginatedAuditLogsResponse> => {
    return http.get<PaginatedAuditLogsResponse>(API_ENDPOINTS.AUDIT.LOGS, { params })
  },
}

export const AuditService = auditService
