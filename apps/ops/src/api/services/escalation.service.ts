import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface ModerationCaseActionItem {
  id: string
  caseId: string
  actionType: string
  performedBy: string
  note: string | null
  performedAt: string
}

export interface ModerationCaseItem {
  id: string
  case_type?: string
  caseType?: string
  target_entity_type?: string
  targetEntityType?: string
  target_entity_id?: string
  targetEntityId?: string
  assigned_staff_id?: string | null
  assignedStaffId?: string | null
  status: 'PENDING' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED' | 'ESCALATED_ADMIN' | string
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | string
  notes?: string
  resolutionNote?: string | null
  resolution_note?: string | null
  created_at?: string
  createdAt?: string
  updated_at?: string
  updatedAt?: string
  resolved_at?: string | null
  resolvedAt?: string | null
  actions?: ModerationCaseActionItem[]
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
  actionType?: 'RESOLVE' | 'DISMISS' | 'BAN_USER' | 'REMOVE_SIGN' | 'REQUEST_RECAPTURE' | 'MERGE_SIGN' | string
  actionNote?: string
  reportId?: string
  targetSignTypeId?: number
  mergedIntoSignTypeId?: number
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

  /**
   * Fetch related target entity details (Candidate, Revalidation Task, Missing Report)
   */
  getTargetEntity: async (targetType?: string, targetId?: string, caseType?: string): Promise<any> => {
    if (!targetId) return null
    const t = (targetType || '').toLowerCase()
    const c = (caseType || '').toUpperCase()
    try {
      if (t === 'candidate') {
        const res: any = await http.get(API_ENDPOINTS.MODERATION.CANDIDATE_DETAIL(targetId))
        return res?.data?.data || res?.data || res
      }
      if (t.includes('reval')) {
        const res: any = await http.get(API_ENDPOINTS.REVALIDATION.TASK_DETAIL(targetId))
        return res?.data?.data || res?.data || res
      }
      if (t.includes('report') || t.includes('missing') || c === 'CATALOG_PROPOSAL') {
        const res: any = await http.get(API_ENDPOINTS.MODERATION.MISSING_TYPE_REPORT_DETAIL(targetId))
        return res?.data?.data || res?.data || res
      }
      return null
    } catch (err) {
      console.warn(`Could not load target entity (${targetType}:${targetId}):`, err)
      return null
    }
  },

  // Backward compatibility wrapper
  getEscalations: async (params?: { status?: string }): Promise<any> => {
    return escalationService.getCases(params)
  },
}

export const EscalationService = escalationService
