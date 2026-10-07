import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  ReviewQueueResponse,
  CandidateDetailResponse,
  VoteDto,
  ReportDto,
  ReviewerStatsResponse,
  MyReviewHistoryResponse,
  TestReviewDto,
  TestAssignDto,
} from '@shared/types'

/**
 * Functional Service Object for Community Peer Reviewers.
 * Complies with RULE.md §6.5 (Functional Service Objects) and project-specification Flow 4.
 */
export const reviewsService = {
  /**
   * Fetch a prioritized queue of candidate traffic signs awaiting community peer review.
   * Supports `includeOwnSubmissions=true` for local development & self-review testing with 1 account.
   *
   * @param params - Optional pagination query (page, pageSize, includeOwnSubmissions).
   */
  getReviewQueue: (params?: {
    page?: number
    pageSize?: number
    includeOwnSubmissions?: boolean
  }): Promise<ReviewQueueResponse> => {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    const allowSelf = params?.includeOwnSubmissions ?? true

    const query = new URLSearchParams()
    query.set('page', String(page))
    query.set('pageSize', String(pageSize))
    if (allowSelf) {
      query.set('includeOwnSubmissions', 'true')
    }

    return http.get<ReviewQueueResponse>(
      `${API_ENDPOINTS.REVIEWS.QUEUE}?${query.toString()}`
    )
  },

  /**
   * Direct Single-Reviewer Test Endpoint: POST /api/v1/reviews/test-review
   * Submits a review for a specific reviewer and immediately evaluates single-vote consensus.
   * Automatically provisions a reviewer profile if missing, deletes prior conflicts, and bypasses surveyor restrictions.
   */
  testReview: (
    dto: TestReviewDto
  ): Promise<{ success: boolean; vote?: number; message?: string; consensus?: any }> => {
    return http.post(API_ENDPOINTS.REVIEWS.TEST_REVIEW, dto)
  },

  /**
   * Direct Candidates to Specific Reviewer: POST /api/v1/reviews/test-assign
   * Directs/resets candidate(s) specifically for a reviewer so they appear at the top of their queue
   * (clears previous skips or votes by that reviewer).
   */
  testAssign: (
    dto?: TestAssignDto
  ): Promise<{ success: boolean; assignedCount?: number; candidateIds?: string[]; message?: string }> => {
    return http.post(API_ENDPOINTS.REVIEWS.TEST_ASSIGN, dto ?? {})
  },

  /**
   * Retrieve full details of a single unverified traffic sign candidate.
   *
   * @param candidateId - UUID of the candidate.
   */
  getCandidateDetail: (candidateId: string): Promise<CandidateDetailResponse> => {
    return http.get<CandidateDetailResponse>(API_ENDPOINTS.REVIEWS.CANDIDATE_DETAIL(candidateId))
  },

  /**
   * Cast an evaluation vote on a traffic sign candidate.
   *
   * @param candidateId - UUID of the candidate.
   * @param dto - Vote payload ({ vote: 1 | -1, suggestedSignTypeId?, declineReason?, declineNote? }).
   */
  castVote: (candidateId: string, dto: VoteDto): Promise<{ success: boolean; vote: number }> => {
    return http.post<{ success: boolean; vote: number }>(
      API_ENDPOINTS.REVIEWS.VOTE(candidateId),
      dto
    )
  },

  /**
   * Retract a previously cast vote on an unresolved candidate sign.
   *
   * @param candidateId - UUID of the candidate.
   */
  undoVote: (candidateId: string): Promise<{ success: boolean }> => {
    return http.delete<{ success: boolean }>(API_ENDPOINTS.REVIEWS.VOTE(candidateId))
  },

  /**
   * Skip a candidate without voting, temporarily advancing the review queue.
   *
   * @param candidateId - UUID of the candidate.
   */
  skipCandidate: (candidateId: string): Promise<{ success: boolean }> => {
    return http.post<{ success: boolean }>(API_ENDPOINTS.REVIEWS.SKIP(candidateId))
  },

  /**
   * Flag a candidate sign for spam, inappropriate content, GPS spoofing, or corrupt image.
   *
   * @param candidateId - UUID of the candidate.
   * @param dto - Flagging reason payload ({ reason: string }).
   */
  reportCandidate: (candidateId: string, dto: ReportDto): Promise<{ success: boolean }> => {
    return http.post<{ success: boolean }>(API_ENDPOINTS.REVIEWS.REPORT(candidateId), dto)
  },

  /**
   * Retrieve reviewer performance metrics, reliability score (w_i), and accuracy rate.
   */
  getMyStats: (): Promise<ReviewerStatsResponse> => {
    return http.get<ReviewerStatsResponse>(API_ENDPOINTS.REVIEWS.STATS)
  },

  /**
   * Retrieve paginated history of past reviews cast by the current reviewer.
   *
   * @param params - Query parameters (page, pageSize, status, search).
   */
  getMyHistory: (params?: {
    page?: number
    pageSize?: number
    status?: string
    search?: string
  }): Promise<MyReviewHistoryResponse> => {
    const query = new URLSearchParams()
    if (params?.page) query.set('page', String(params.page))
    if (params?.pageSize) query.set('pageSize', String(params.pageSize))
    if (params?.status) query.set('status', params.status)
    if (params?.search) query.set('search', params.search)

    const queryString = query.toString() ? `?${query.toString()}` : ''
    return http.get<MyReviewHistoryResponse>(`${API_ENDPOINTS.REVIEWS.HISTORY}${queryString}`)
  },
}
