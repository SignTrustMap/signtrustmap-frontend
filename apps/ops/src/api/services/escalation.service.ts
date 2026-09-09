import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { AdminEscalationCase } from '@/data/adminGovernanceData'

export interface ResolveEscalationDto {
  status: 'Resolved' | 'Rejected'
  verdictNotes: string
}

export const escalationService = {
  /**
   * Fetch all staff escalation cases
   */
  getEscalations: async (params?: { status?: string }): Promise<ApiResponse<AdminEscalationCase[]>> => {
    return http.get<ApiResponse<AdminEscalationCase[]>>(API_ENDPOINTS.ESCALATIONS.BASE, { params })
  },

  /**
   * Resolve an escalated case with verdict justification
   */
  resolveCase: async (caseId: string, data: ResolveEscalationDto): Promise<ApiResponse<AdminEscalationCase>> => {
    return http.post<ApiResponse<AdminEscalationCase>>(API_ENDPOINTS.ESCALATIONS.RESOLVE(caseId), data)
  },
}

export const EscalationService = escalationService
