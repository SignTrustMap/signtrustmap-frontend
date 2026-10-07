import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface ModerationCaseItem {
  id: string
  case_type?: string
  caseType?: string
  target_entity_type?: string
  target_entity_id?: string
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' | string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
  notes?: string
  created_at: string
  updated_at: string
  actions?: any[]
  reports?: any[]
}

export interface PaginatedCasesResponse {
  items: ModerationCaseItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ResolveCaseInput {
  resolutionNote: string
  actionType?: 'DISMISS' | 'BAN_USER' | 'REMOVE_SIGN' | 'MERGE_SIGN' | string
  actionNote?: string
}

// Backwards compatibility types
export interface ResolveEscalationDto {
  status: 'Resolved' | 'Rejected'
  verdictNotes: string
}

export const escalationService = {
  /**
   * Fetch all staff moderation & escalation cases via GET /api/v1/moderation/cases
   */
  getCases: async (params?: { status?: string; page?: number; pageSize?: number }): Promise<PaginatedCasesResponse> => {
    return http.get<PaginatedCasesResponse>(API_ENDPOINTS.MODERATION.CASES, { params })
  },

  /**
   * Get single moderation case detail
   */
  getCaseById: async (caseId: string): Promise<ModerationCaseItem> => {
    return http.get<ModerationCaseItem>(API_ENDPOINTS.MODERATION.CASE_DETAIL(caseId))
  },

  /**
   * Resolve an escalated case with verdict justification via PUT /api/v1/moderation/cases/:id/resolve
   */
  resolveCase: async (caseId: string, data: ResolveCaseInput): Promise<any> => {
    return http.put<any>(API_ENDPOINTS.MODERATION.RESOLVE_CASE(caseId), data)
  },

  // Backward compatibility wrapper
  getEscalations: async (params?: { status?: string }): Promise<any> => {
    return escalationService.getCases(params)
  },
}

export const EscalationService = escalationService
