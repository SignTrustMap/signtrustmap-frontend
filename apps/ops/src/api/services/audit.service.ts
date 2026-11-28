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

export interface TaskParticipantUser {
  id: string
  fullName: string
  email?: string | null
  role?: string
}

export interface AdminTaskHistoryListItem {
  requestId: string
  activityType: 'CANDIDATE_RECAPTURE' | 'REVALIDATION_EVIDENCE' | string
  taskId: string
  reason?: string | null
  note?: string | null
  occurredAt: string
  surveyor?: TaskParticipantUser | null
  surveyorId?: string | null
  surveyorName?: string | null
  reviewer?: TaskParticipantUser | null
  reviewerId?: string | null
  reviewerName?: string | null
  isCompleted: boolean
  completedAt?: string | null
}

export interface PaginatedTaskHistoryResponse {
  items: AdminTaskHistoryListItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface TaskSurveyorRequestItem {
  id: string
  type: 'RECAPTURE_REQUEST' | 'EVIDENCE_SUBMISSION' | string
  status?: string
  reason?: string
  note?: string
  mediaUrl?: string
  surveyorId: string
  surveyorName: string
  surveyorEmail?: string | null
  surveyor?: TaskParticipantUser | null
  reviewerId?: string | null
  reviewerName?: string | null
  reviewerEmail?: string | null
  reviewer?: TaskParticipantUser | null
  requestedAt?: string
  submittedAt?: string
  completedAt?: string
}

export interface TaskReviewItem {
  id: string
  evidenceId?: string
  candidateId?: string
  reviewerId: string
  reviewerName: string
  reviewerEmail?: string | null
  reviewer?: TaskParticipantUser | null
  decision?: string
  vote?: number
  note?: string
  declineReason?: string
  declineNote?: string
  suggestedSignTypeId?: number | null
  decidedAt?: string
  reviewedAt?: string
}

export interface TaskTimelineEventItem {
  eventId: string
  eventType: string
  timestamp: string
  actor: TaskParticipantUser
  actorRole?: string
  description: string
  details?: Record<string, any>
}

export interface TaskHistoryDetailResponse {
  taskId: string
  taskType: 'REVALIDATION' | 'CANDIDATE' | string
  status?: string
  surveyor?: TaskParticipantUser | null
  surveyorName?: string | null
  surveyorId?: string | null
  reviewer?: TaskParticipantUser | null
  reviewerName?: string | null
  reviewerId?: string | null
  task: Record<string, any>
  surveyorRequests: TaskSurveyorRequestItem[]
  reviews: TaskReviewItem[]
  timeline: TaskTimelineEventItem[]
}

export const auditService = {
  /**
   * Fetch immutable security audit logs via GET /api/v1/admin/audit-logs
   */
  getAuditLogs: async (params?: ListAuditLogsParams): Promise<PaginatedAuditLogsResponse> => {
    return http.get<PaginatedAuditLogsResponse>(API_ENDPOINTS.AUDIT.LOGS, { params })
  },

  /**
   * Fetch paginated cross-task surveyor requests & review activities via GET /api/v1/admin/tasks/history
   */
  getTaskHistoryList: async (params?: {
    page?: number
    pageSize?: number
    taskId?: string
    surveyorId?: string
    reviewerId?: string
    type?: string
  }): Promise<PaginatedTaskHistoryResponse> => {
    const res: any = await http.get(API_ENDPOINTS.AUDIT.TASK_HISTORY, { params })
    return res?.data?.items ? res.data : res
  },

  /**
   * Fetch detailed timeline and participant identities for a specific task or candidate via GET /api/v1/admin/tasks/:taskId/history
   */
  getTaskHistoryDetail: async (taskId: string): Promise<TaskHistoryDetailResponse> => {
    const res: any = await http.get(API_ENDPOINTS.AUDIT.TASK_HISTORY_DETAIL(taskId))
    return res?.data?.taskId ? res.data : res
  },
}

export const AuditService = auditService
