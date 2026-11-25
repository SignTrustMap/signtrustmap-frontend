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
  items: {
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
  }[];
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
    id?: string;
    userId?: string;
    surveyorId?: string;
    mediaUrl?: string;
    evidenceType: RevalidationEvidenceType | string;
    submittedAt: string;
    latitude: number;
    longitude: number;
    distanceMeters: number | null;
    suggestedSignTypeId?: number;
  questClaimId?: string;
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
  questClaimId?: string;
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
  accuracyMeters?: number;
  capturedAt?: string;
  confirmedSignId?: string;
  evidenceType?: RevalidationEvidenceType;
  headingDegrees?: number;
  isLiveCapture?: boolean;
  mediaUrl?: string;
  suggestedSignTypeId?: number;
  questClaimId?: string;
  // UI-only helper fields (omitted from outgoing payload)
  note?: string;
  condition?: string;
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

export interface CheckInEligibilityDto {
  latitude: number;
  longitude: number;
  accuracyMeters?: number;
}

export interface RevalidationCheckInResponse {
  eligible: boolean;
  canCaptureLive: boolean;
  taskId: string;
  signId: string;
  taskStatus: string;
  distanceMeters: number;
  maxProximityMeters: number;
  isWithinProximity: boolean;
  remainingDistanceMeters: number;
  dailyLimitReached: boolean;
  recentSubmissionsCount: number;
  dailySubmissionLimit: number;
  remainingSubmissionsToday: number;
  targetLocation: { lat: number; lon: number };
  surveyorLocation: { lat: number; lon: number };
  message: string;
}

export interface RequestEvidenceRecaptureDto {
  reason: string;
  note?: string;
}

export interface RequestEvidenceRecaptureResponse {
  success: boolean;
  evidenceId: string;
  taskId: string;
  surveyorId: string;
  reason: string;
  note?: string;
  notificationSent: boolean;
}

export interface AmbiguousSignCandidate {
  id: string;
  signCode: string;
  nameVi?: string;
  nameEn?: string;
  signCropUrl?: string;
  distanceMeters?: number;
  latitude?: number;
  longitude?: number;
}

export interface AmbiguousTargetSignErrorData {
  error: 'AMBIGUOUS_TARGET_SIGN';
  targetSignId: string;
  candidates: AmbiguousSignCandidate[];
}

export interface VerifiedSignHistoryItem {
  id: string;
  signId: string;
  previousSignCode?: string;
  previousSignNameVi?: string;
  previousCropUrl?: string;
  changeReason?: string;
  changedAt: string;
  changedBy?: string;
}

export interface SignLifecycleEventItem {
  id: string;
  signId: string;
  eventType:
    | 'CONFIRMED'
    | 'DISPUTED'
    | 'REVALIDATED'
    | 'REVALIDATION_CHANGED'
    | 'DECOMMISSIONED'
    | 'AUTO_DELISTED'
    | string;
  eventAt: string;
  metadata?: Record<string, any>;
}

export interface SignHistoryResponse {
  signId: string;
  currentSign?: any;
  history: VerifiedSignHistoryItem[];
  lifecycleEvents: SignLifecycleEventItem[];
}


