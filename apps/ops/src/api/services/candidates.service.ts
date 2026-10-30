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
  predictedSignType?: PredictedSignTypeDto
  submission?: CandidateSubmissionDto
  locationContext?: CandidateLocationContextDto | null
}

export interface CandidateDetailResponse {
  candidate: ReviewCandidateDto
  submission?: CandidateSubmissionDto | null
  voteCount?: number
  locationContext?: CandidateLocationContextDto | null
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

export const candidatesService = {
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
   * Fetch prioritized candidate queue awaiting moderation/peer review.
   * Calls GET /api/v1/reviews/queue
   */
  getQueue: async (params?: { page?: number; pageSize?: number; includeOwnSubmissions?: boolean }): Promise<any> => {
    return http.get(API_ENDPOINTS.MODERATION.CANDIDATES, { params })
  },
}

export const CandidatesService = candidatesService
