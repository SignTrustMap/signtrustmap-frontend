import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface CheckInEligibilityDto {
  latitude: number
  longitude: number
  accuracyMeters?: number
}

export interface RevalidationCheckInResponse {
  eligible: boolean
  canCaptureLive: boolean
  taskId: string
  signId: string
  taskStatus: string
  distanceMeters: number
  maxProximityMeters: number
  isWithinProximity: boolean
  remainingDistanceMeters: number
  dailyLimitReached: boolean
  recentSubmissionsCount: number
  dailySubmissionLimit: number
  remainingSubmissionsToday: number
  targetLocation: { lat: number; lon: number }
  surveyorLocation: { lat: number; lon: number }
  message: string
}

export interface RevalidationEvidenceItem {
  id: string
  task_id?: string
  taskId?: string
  user_id?: string
  userId?: string
  media_url?: string
  mediaUrl?: string
  evidence_type?: 'STILL_ACTIVE' | 'REMOVED' | 'CHANGED' | string
  evidenceType?: 'STILL_ACTIVE' | 'REMOVED' | 'CHANGED' | string
  submitted_at?: string
  submittedAt?: string
  location_wkt?: string
  latitude?: number
  longitude?: number
  distance_meters?: number
  distanceMeters?: number
  surveyor_name?: string
  surveyorName?: string
  surveyor_email?: string
  surveyorEmail?: string
  surveyor?: { id?: string; fullName?: string; email?: string | null } | null
}

export interface RevalidationDecisionItem {
  id: string
  evidenceId: string
  reviewerId: string
  reviewerName?: string
  reviewerEmail?: string | null
  reviewer?: { id?: string; fullName?: string; email?: string | null } | null
  decision: 'UNCHANGED' | 'STILL_ACTIVE' | 'CHANGED' | 'MISSING' | 'REMOVED' | 'UNCLEAR' | 'INVALID' | string
  suggestedSignTypeId?: number | null
  note?: string | null
  decidedAt: string
}

export interface EarlyClassificationResult {
  className?: string
  standardCode?: string
  confidence?: number
  boundingBox?: any
  trafficSignTypeId?: number
}

export interface RevalidationTaskItem {
  id: string
  verified_sign_id?: string
  verifiedSignId?: string
  freshness_rule_id?: number | null
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' | string
  reward_credits?: number
  rewardCredits?: number
  bounty?: number
  urgency?: number
  route_classification_id?: number | null
  status: 'OPEN' | 'EVALUATING' | 'COMPLETED' | 'EXPIRED' | 'ESCALATED_MODERATION' | string
  created_at?: string
  createdAt?: string
  expired_at?: string | null
  expiresAt?: string | null
  updated_at?: string

  // Joined sign fields
  sign_type_id?: number
  signTypeId?: number
  sign_status?: string
  signStatus?: string
  freshness_score?: number
  freshnessScore?: number
  longitude?: number
  latitude?: number
  location?: { lat: number; lon: number } | null
  sign_crop_url?: string
  signCropUrl?: string
  sign_code?: string
  signCode?: string
  name_en?: string
  nameEn?: string
  name_vi?: string
  nameVi?: string

  // Embedded or detail relation objects
  sign?: any
  evidences?: RevalidationEvidenceItem[]
  evidence_count?: number
  assignedSurveyor?: string | null
  surveyorName?: string | null
  surveyor?: { id?: string; fullName?: string; email?: string | null } | null
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
  sort?: 'reward' | 'urgency' | string
  lat?: number
  lon?: number
  radiusMeters?: number
}

export interface BboxTasksParams {
  min_lat?: number
  min_lon?: number
  max_lat?: number
  max_lon?: number
  status?: string
  priority?: string
  page?: number
  pageSize?: number
}

export interface EvidenceVotePayload {
  decision: 'UNCHANGED' | 'STILL_ACTIVE' | 'CHANGED' | 'MISSING' | 'REMOVED' | 'UNCLEAR' | 'INVALID' | string
  suggestedSignTypeId?: number
  note?: string
}

export interface RequestRecapturePayload {
  reason: string
  note?: string
}

export function normalizeRevalidationTask(raw: any): RevalidationTaskItem {
  if (!raw || typeof raw !== 'object') return raw
  const lat = raw.latitude ?? raw.lat ?? raw.location?.lat
  const lon = raw.longitude ?? raw.lon ?? raw.location?.lon
  const reward = raw.rewardCredits ?? raw.reward_credits ?? raw.bounty ?? 25
  const signId = raw.verifiedSignId ?? raw.verified_sign_id ?? raw.signId

  return {
    ...raw,
    id: raw.id,
    verifiedSignId: signId,
    verified_sign_id: signId,
    latitude: lat,
    longitude: lon,
    location: lat != null && lon != null ? { lat, lon } : (raw.location ?? null),
    rewardCredits: reward,
    reward_credits: reward,
    bounty: reward,
    priority: raw.priority ?? 'MEDIUM',
    status: raw.status ?? 'OPEN',
    signCode: raw.signCode ?? raw.sign_code,
    sign_code: raw.signCode ?? raw.sign_code,
    nameVi: raw.nameVi ?? raw.name_vi,
    name_vi: raw.nameVi ?? raw.name_vi,
    nameEn: raw.nameEn ?? raw.name_en,
    name_en: raw.nameEn ?? raw.name_en,
    signCropUrl: raw.signCropUrl ?? raw.sign_crop_url,
    sign_crop_url: raw.signCropUrl ?? raw.sign_crop_url,
    freshnessScore: raw.freshnessScore ?? raw.freshness_score,
    freshness_score: raw.freshnessScore ?? raw.freshness_score,
  }
}

export const revalidationService = {
  /**
   * List revalidation verification tasks with filters (status, sort, spatial radius)
   */
  getTasks: async (params?: ListTasksParams, config?: Record<string, any>): Promise<PaginatedRevalidationTasksResponse> => {
    const res = await http.get<PaginatedRevalidationTasksResponse>(API_ENDPOINTS.REVALIDATION.TASKS, { params, ...config })
    if (res?.items && Array.isArray(res.items)) {
      return {
        ...res,
        items: res.items.map(normalizeRevalidationTask),
      }
    }
    return res
  },

  /**
   * List revalidation tasks inside a geographic bounding box
   */
  getTasksInBbox: async (params: BboxTasksParams, config?: Record<string, any>): Promise<PaginatedRevalidationTasksResponse> => {
    const res = await http.get<PaginatedRevalidationTasksResponse>(API_ENDPOINTS.REVALIDATION.TASK_MAP, { params, ...config })
    if (res?.items && Array.isArray(res.items)) {
      return {
        ...res,
        items: res.items.map(normalizeRevalidationTask),
      }
    }
    return res
  },

  /**
   * Check in surveyor GPS coordinates before capturing live evidence
   */
  checkIn: async (taskId: string, dto: CheckInEligibilityDto): Promise<RevalidationCheckInResponse> => {
    return http.post<RevalidationCheckInResponse>(API_ENDPOINTS.REVALIDATION.TASK_CHECK_IN(taskId), dto)
  },

  /**
   * Get single task detail with coordinates and evidences
   */
  getTaskById: async (taskId: string): Promise<RevalidationTaskItem> => {
    const res = await http.get<RevalidationTaskItem>(API_ENDPOINTS.REVALIDATION.TASK_DETAIL(taskId))
    return normalizeRevalidationTask(res)
  },

  /**
   * Get evidences submitted for a specific task
   */
  getTaskEvidences: async (taskId: string): Promise<RevalidationEvidenceItem[]> => {
    return http.get<RevalidationEvidenceItem[]>(API_ENDPOINTS.REVALIDATION.TASK_EVIDENCES(taskId))
  },

  /**
   * Get evidences across all revalidation tasks for a verified sign
   */
  getSignEvidences: async (signId: string): Promise<RevalidationEvidenceItem[]> => {
    return http.get<RevalidationEvidenceItem[]>(API_ENDPOINTS.REVALIDATION.SIGN_EVIDENCES(signId))
  },

  /**
   * Submit surveyor evidence (multipart/form-data with photo and coordinates)
   */
  submitEvidence: async (taskId: string, formData: FormData): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.REVALIDATION.TASK_SUBMIT_EVIDENCE(taskId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /**
   * Staff/Admin manually finalize a revalidation task and award bounties
   */
  finalizeTask: async (taskId: string): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.REVALIDATION.TASK_FINALIZE(taskId))
  },

  /**
   * Trigger AI early classification on task evidence photo
   */
  triggerEarlyClassify: async (taskId: string, mediaUrl?: string): Promise<{
    success: boolean
    earlyClassification?: EarlyClassificationResult
    resolvedSignTypeId?: number | null
  }> => {
    return http.post<any>(API_ENDPOINTS.REVALIDATION.TASK_EARLY_CLASSIFY(taskId), { mediaUrl })
  },

  /**
   * Cast reviewer / admin vote on a submitted evidence item
   */
  voteEvidence: async (evidenceId: string, dto: EvidenceVotePayload): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.REVALIDATION.EVIDENCE_VOTE(evidenceId), dto)
  },

  /**
   * Request surveyor to recapture evidence photo due to blurriness or obstruction
   */
  requestEvidenceRecapture: async (evidenceId: string, dto: RequestRecapturePayload): Promise<any> => {
    return http.post<any>(API_ENDPOINTS.REVALIDATION.EVIDENCE_REQUEST_RECAPTURE(evidenceId), dto)
  },

  /**
   * Retrieve reviewer evidence queue awaiting consensus decisions
   */
  getEvidenceQueue: async (params?: { page?: number; pageSize?: number }): Promise<any> => {
    return http.get<any>(API_ENDPOINTS.REVALIDATION.EVIDENCE_QUEUE, { params })
  },

  /**
   * List history of decisions for a specific evidence item
   */
  getEvidenceDecisions: async (evidenceId: string): Promise<RevalidationDecisionItem[]> => {
    return http.get<RevalidationDecisionItem[]>(API_ENDPOINTS.REVALIDATION.EVIDENCE_DECISIONS(evidenceId))
  },

  /**
   * Dispatch / escalate a revalidation task for a verified traffic sign
   */
  requestRevalidationForSign: async (
    signId: string,
    payload: { note?: string; photoEvidenceUrl?: string; latitude?: number; longitude?: number }
  ): Promise<any> => {
    return http.post(API_ENDPOINTS.SIGNS.CONFIRM(signId), {
      isPresent: false,
      ...payload,
    })
  },
}

export const RevalidationService = revalidationService

