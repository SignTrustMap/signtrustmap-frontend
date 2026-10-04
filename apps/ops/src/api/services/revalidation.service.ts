import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface RevalidationTaskItem {
  id: string
  verified_sign_id?: string
  verifiedSignId?: string
  status: 'PENDING' | 'ASSIGNED' | 'EVIDENCE_SUBMITTED' | 'RESOLVED' | 'STALE' | string
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT' | string
  latitude?: number
  longitude?: number
  created_at?: string
  updated_at?: string
  sign?: any
  evidences?: any[]
}

export interface PaginatedRevalidationTasksResponse {
  items: RevalidationTaskItem[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface ListTasksParams {
  page?: number
  pageSize?: number
  status?: string
  sort?: string
  lat?: number
  lon?: number
  radiusMeters?: number
}

export const revalidationService = {
  /**
   * List revalidation verification tasks
   */
  getTasks: async (params?: ListTasksParams): Promise<PaginatedRevalidationTasksResponse> => {
    return http.get<PaginatedRevalidationTasksResponse>(API_ENDPOINTS.REVALIDATION.TASKS, { params })
  },

  /**
   * Get single task detail
   */
  getTaskById: async (taskId: string): Promise<RevalidationTaskItem> => {
    return http.get<RevalidationTaskItem>(API_ENDPOINTS.REVALIDATION.TASK_DETAIL(taskId))
  },

  /**
   * Get evidences submitted for a task
   */
  getTaskEvidences: async (taskId: string): Promise<any[]> => {
    return http.get<any[]>(API_ENDPOINTS.REVALIDATION.TASK_EVIDENCES(taskId))
  },

  /**
   * Staff/Admin manually finalize a revalidation task and award bounties
   */
  finalizeTask: async (taskId: string): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.REVALIDATION.TASK_FINALIZE(taskId))
  },
}

export const RevalidationService = revalidationService
