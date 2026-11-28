import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'

export interface PredictedSignTypeDto {
  id: number
  signCode: string
  nameVi: string
  nameEn: string
  shape?: string
  color?: string
  categoryId?: number
}

export interface CandidateSubmissionDto {
  surveyor_id?: string
  surveyorId?: string
  surveyor_name?: string | null
  surveyorName?: string | null
  surveyor_email?: string | null
  surveyorEmail?: string | null
  surveyor?: { id?: string; fullName?: string; email?: string | null } | null
  captured_at?: string
  createdAt?: string
  submission_type?: string
  status?: string
  latitude?: number | null
  longitude?: number | null
  note?: string | null
}

export interface CandidateLocationContextDto {
  coordinates?: {
    latitude: number
    longitude: number
  } | null
  displayLocation?: string
  nearbyRoad?: string | null
  direction?: number | null
}

export interface ReviewCandidateDto {
  id: string
  submissionId: string
  predictedSignTypeId?: number
  confidenceScore?: number
  bestFrameUrl?: string
  signCropUrl?: string
  spatialConfidence?: 'HIGH' | 'LOW' | string
  status?: string
  createdAt?: string
  activeLearningPriority?: number
  possibleSigns?: any[]
  predictedSignType?: PredictedSignTypeDto
  submission?: CandidateSubmissionDto
  locationContext?: CandidateLocationContextDto | null
  surveyorId?: string | null
  surveyorName?: string | null
  surveyor?: { id?: string; fullName?: string; email?: string | null } | null
  reviews?: any[]
  recaptures?: any[]
}

export interface CandidateDetailResponse {
  candidate: ReviewCandidateDto
  submission?: CandidateSubmissionDto | null
  voteCount?: number
  locationContext?: CandidateLocationContextDto | null
  possibleSigns?: any[]
  top5?: any[]
  remedySigns?: any[]
  predictedSignTypes?: any[]
}

export interface VoteCandidateDto {
  vote: 1 | -1 | 0
  suggestedSignTypeId?: number
  declineReason?: string
  declineNote?: string
}

export interface RequestRecaptureDto {
  reason: string
  note?: string
}

export interface ReportCandidateDto {
  reason: string
}

export interface SignRemedyDto {
  signTypeId: number
  signCode: string
  nameVi: string
  nameEn: string
  confidence?: number
  previewUrl?: string
}

export interface CandidateQueryParams {
  page?: number
  pageSize?: number
  status?: string
  tag?: string
  search?: string
  surveyorId?: string
  sortBy?: 'reviewedAt' | 'createdAt' | 'confidence' | 'status'
  sortOrder?: 'ASC' | 'DESC'
  reviewerId?: string
}

export interface CandidateCategoryCount {
  id: string
  label: string
  count: number
}

export interface CandidateListResponse {
  items: any[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  counts?: {
    ALL: number
    PENDING_REVIEW: number
    IN_CONSENSUS: number
    RESOLVED: number
    all?: number
    unprocessed?: number
    inReview?: number
    reviewed?: number
  }
  categories?: CandidateCategoryCount[]
}

export const candidatesService = {
  /**
   * Fetch reviewed candidates history from official NestJS candidates endpoint.
   * Calls GET /api/v1/candidates
   */
  getCandidates: async (params?: CandidateQueryParams): Promise<CandidateListResponse> => {
    const res: any = await http.get(API_ENDPOINTS.MODERATION.CANDIDATES, { params })
    if (res?.data && res?.success !== undefined) {
      return res.data
    }
    return res
  },

  /**
   * Retrieve full details of an unverified traffic sign candidate from NestJS backend.
   * Calls GET /api/v1/reviews/candidates/:id
   */
  getCandidateDetail: async (candidateId: string): Promise<CandidateDetailResponse> => {
    const rawId = candidateId.replace(/^#/, '')
    const res: any = await http.get(API_ENDPOINTS.MODERATION.CANDIDATE_DETAIL(rawId))
    // Unwrap ApiResponse if needed
    if (res?.data && res?.success !== undefined) {
      return res.data
    }
    return res
  },

  /**
   * Cast an approval or rejection vote on a candidate sign.
   * Calls POST /api/v1/reviews/:candidateId/vote
   */
  vote: async (candidateId: string, dto: VoteCandidateDto): Promise<any> => {
    const rawId = candidateId.replace(/^#/, '')
    return http.post(API_ENDPOINTS.MODERATION.DECISION(rawId), dto)
  },

  /**
   * Test/force review endpoint for staff/admin to immediately evaluate and resolve consensus.
   * Calls POST /api/v1/reviews/test-review
   */
  testReview: async (candidateId: string, dto: VoteCandidateDto): Promise<any> => {
    const rawId = candidateId.replace(/^#/, '')
    return http.post('/api/v1/reviews/test-review', {
      candidateId: rawId,
      ...dto,
    })
  },

  /**
   * Request field surveyor to recapture a clearer image of this sign.
   * Calls POST /api/v1/reviews/candidates/:candidateId/request-recapture
   */
  requestRecapture: async (candidateId: string, dto: RequestRecaptureDto): Promise<any> => {
    const rawId = candidateId.replace(/^#/, '')
    return http.post(API_ENDPOINTS.MODERATION.REQUEST_RECAPTURE(rawId), dto)
  },

  /**
   * Escalate or flag a candidate for moderation investigation (spam, GPS spoofing, corruption).
   * Calls POST /api/v1/reviews/candidates/:candidateId/report
   */
  reportOrEscalate: async (candidateId: string, dto: ReportCandidateDto): Promise<any> => {
    const rawId = candidateId.replace(/^#/, '')
    return http.post(`/api/v1/reviews/candidates/${encodeURIComponent(rawId)}/report`, dto)
  },

  /**
   * Fetch AI-ranked alternative sign suggestions that could replace the candidate label.
   * Calls GET /api/v1/reviews/candidates/:candidateId/sign-remedies
   */
  getSignRemedies: async (candidateId: string): Promise<SignRemedyDto[]> => {
    const rawId = candidateId.replace(/^#/, '')
    const res: any = await http.get(`/api/v1/reviews/candidates/${encodeURIComponent(rawId)}/sign-remedies`)
    return res?.data || res || []
  },

  /**
   * Retrieve recapture history and reviewer comments for this candidate.
   * Calls GET /api/v1/reviews/candidates/:candidateId/recaptures
   */
  getRecaptures: async (candidateId: string): Promise<any[]> => {
    const rawId = candidateId.replace(/^#/, '')
    const res: any = await http.get(API_ENDPOINTS.MODERATION.CANDIDATE_RECAPTURES(rawId))
    return res?.data || res || []
  },

  /**
   * Fetch prioritized candidate queue awaiting peer review.
   * Calls GET /api/v1/reviews/queue
   */
  getQueue: async (params?: { page?: number; pageSize?: number; includeOwnSubmissions?: boolean }): Promise<any> => {
    return http.get(API_ENDPOINTS.MODERATION.CANDIDATE_QUEUE, { params })
  },
}

export const CandidatesService = candidatesService
