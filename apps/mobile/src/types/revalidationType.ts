import type { SignCategory } from '@/constants/sign-categories';

export type TaskPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';

export type TaskStatus =
  | 'OPEN'
  | 'EVALUATING'
  | 'COMPLETED'
  | 'CLOSED'
  | 'EXPIRED'
  | 'ESCALATED_MODERATION';

export type RevalidationEvidenceType = 'STILL_ACTIVE' | 'REMOVED' | 'CHANGED';

export interface RevalidationTaskItem {
  id: string;
  verifiedSignId: string;
  code: string;
  name: string;
  roadName?: string;
  category: SignCategory;
  priority: TaskPriority;
  status: TaskStatus;
  staleDays: number;
  latitude: number;
  longitude: number;
  historicalCropUrl?: string;
  representativeUrl?: string;
  lastVerifiedDate?: string;
  currentTrustScore?: number;
  reason: string;
  rewardCredits: number;
}

export type FindTasksInBoundsParams = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
  status?: TaskStatus | string;
  priority?: TaskPriority | string;
  page?: number;
  pageSize?: number;
};

export type GetRevalidationTasksParams = {
  page?: number;
  pageSize?: number;
  status?: string;
  sort?: 'reward' | 'urgency' | 'distance' | string;
  lat?: number;
  lon?: number;
  radiusMeters?: number;
};

export type RevalidationTasksInBoundsResponse = {
  items: Array<{
    id: string;
    verified_sign_id?: string;
    verifiedSignId?: string;
    status: string;
    priority: string;
    reason?: string;
    reward_credits?: number;
    rewardCredits?: number;
    latitude: number;
    longitude: number;
    sign_crop_url?: string;
    signCropUrl?: string;
    sign_code?: string;
    signCode?: string;
    name_en?: string;
    nameEn?: string;
    name_vi?: string;
    nameVi?: string;
    freshness_score?: number;
    freshnessScore?: number;
    created_at?: string;
    createdAt?: string;
  }>;
  total: number;
  page?: number;
  pageSize?: number;
  totalPages?: number;
};

export interface RevalidationEvidenceDetailItem {
  id: string;
  taskId: string;
  surveyorId?: string;
  mediaUrl?: string;
  evidenceType: RevalidationEvidenceType | string;
  suggestedSignTypeId?: number | null;
  submittedAt: string;
  capturedAt?: string;
  locationWkt?: string;
  distanceMeters?: number;
  status?: string;
}

export interface RevalidationTaskDetail {
  id: string;
  verifiedSignId: string;
  freshnessRuleId?: number | null;
  priority: TaskPriority | string;
  status: TaskStatus | string;
  rewardCredits: number;
  bounty: number;
  urgency: number;
  expiredAt?: string | null;
  createdAt: string;
  updatedAt?: string;
  location: { lat: number; lon: number } | null;
  evidences: RevalidationEvidenceDetailItem[];
  // UI helper fields
  code?: string;
  name?: string;
  category?: SignCategory;
  latitude?: number;
  longitude?: number;
  signCropUrl?: string;
  historicalCropUrl?: string;
}

export type RevalidationFilterPriority = 'ALL' | TaskPriority;
export type RevalidationFilterCategory = 'ALL' | SignCategory;

export interface RevalidationFilterState {
  priority: RevalidationFilterPriority;
  category: RevalidationFilterCategory;
  searchQuery: string;
}

export type RevalDecision =
  | 'UNCHANGED'
  | 'STILL_ACTIVE'
  | 'CHANGED'
  | 'MISSING'
  | 'REMOVED'
  | 'UNCLEAR'
  | 'INVALID';

export interface RevalidationQueueEvidenceItem {
  evidenceId: string;
  taskId: string;
  verifiedSign: {
    id: string;
    signCode: string;
    nameVi?: string;
    nameEn?: string;
    signCropUrl?: string;
    lastVerifiedAt?: string;
    freshnessScore?: number;
  };
  evidence: {
    mediaUrl?: string;
    evidenceType: RevalidationEvidenceType | string;
    submittedAt: string;
    latitude: number;
    longitude: number;
    distanceMeters: number | null;
  };
  currentVoteCount: number;
  taskStatus: string;
  rewardCredits: number;
}

export interface RevalidationEvidenceQueueResponse {
  items: RevalidationQueueEvidenceItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface RevalidationDecisionItem {
  id: string;
  evidenceId: string;
  reviewerId: string;
  decision: RevalDecision | string;
  suggestedSignTypeId: number | null;
  note: string | null;
  decidedAt: string;
}

export interface EvidenceVoteDto {
  decision: RevalDecision | string;
  suggestedSignTypeId?: number;
  note?: string;
}

export interface EvidenceVoteResponse {
  vote: {
    id: string;
    evidenceId: string;
    reviewerId: string;
    decision: string;
    suggestedSignTypeId: number | null;
    note: string | null;
    decidedAt: string;
  };
  consensus: {
    evaluated: boolean;
    reason?: string;
    totalVotes?: number;
    minVotesRequired?: number;
    winningDecision?: string;
    voteCounts?: Record<string, number>;
    signAction?: string;
    escalatedToModeration?: boolean;
    creditedSubmitters?: number;
    creditedReviewers?: number;
    rewardPerSubmitter?: number;
    taskId?: string;
  } | null;
}

export type SubmitRevalidationEvidenceDto = {
  latitude: number;
  longitude: number;
  capturedAt?: string;
  note?: string;
  condition?: string;
  mediaUrl?: string;
  evidenceType?: RevalidationEvidenceType;
  suggestedSignTypeId?: number;
};

export type SubmitRevalidationEvidenceResponse = {
  id: string;
  taskId?: string;
  userId?: string;
  verifiedSignId?: string;
  mediaUrl?: string;
  evidenceType?: RevalidationEvidenceType | string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  maxProximityMeters?: number;
  dailySubmissionLimit?: number;
  remainingDailySubmissions?: number;
  status?: string;
};

