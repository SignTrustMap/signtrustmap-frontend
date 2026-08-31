import { http, type ApiResponse } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type { AdminEscalationCase } from '@/data/adminGovernanceData'

export interface ResolveEscalationDto {
  status: 'Resolved' | 'Rejected'
  verdictNotes: string
}

export class EscalationService {
  /**
   * Fetch all staff escalation cases
   */
  static async getEscalations(params?: { status?: string }): Promise<ApiResponse<AdminEscalationCase[]>> {
    return http.get<ApiResponse<AdminEscalationCase[]>>(API_ENDPOINTS.ESCALATIONS.BASE, { params })
  }

  /**
   * Resolve an escalated case with verdict justification
   */
  static async resolveCase(caseId: string, data: ResolveEscalationDto): Promise<ApiResponse<AdminEscalationCase>> {
    return http.post<ApiResponse<AdminEscalationCase>>(API_ENDPOINTS.ESCALATIONS.RESOLVE(caseId), data)
  }
}
