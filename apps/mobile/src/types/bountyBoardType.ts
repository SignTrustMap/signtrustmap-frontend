export type QuestTargetType = 'CANDIDATE_VALIDATION' | 'REVALIDATION_TASK';

export type QuestClaimStatus = 'CLAIMED' | 'COMPLETED' | 'EXPIRED' | 'ABANDONED';

export interface BountyQuestItem {
  targetType: QuestTargetType;
  targetId: string;
  title: string;
  signCode: string | null;
  signName: string | null;
  signCropUrl: string | null;
  bestFrameUrl?: string | null;
  displayAddress?: string | null;
  latitude: number | null;
  longitude: number | null;
  distanceMeters: number | null;
  votesCount: number;
  isPromoted: boolean;
  baseRewardCredits: number;
  escalatedBonusCredits: number;
  totalRewardCredits: number;
}

export interface ReviewerQuestClaim {
  id: string;
  reviewerId: string;
  targetType: QuestTargetType;
  targetId: string;
  status: QuestClaimStatus;
  timeLimitMinutes: number;
  claimedAt: string;
  expiresAt: string;
  completedAt: string | null;
  baseRewardCredits: number;
  escalatedBonusCredits: number;
  penaltyApplied: boolean;
  penaltyNotes: string | null;
}

export interface ClaimQuestDto {
  targetType: QuestTargetType;
  targetId: string;
}

export interface QueryAvailableQuestsParams {
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  targetType?: QuestTargetType;
}

export interface CandidateCheckInResponse {
  eligible: boolean;
  canVote: boolean;
  candidateId: string;
  candidateStatus: string;
  distanceMeters: number | null;
  maxGeofenceRadius: number | null;
  isWithinProximity: boolean;
  remainingDistanceMeters: number | null;
  message: string;
  targetLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  reviewerLocation?: {
    latitude: number;
    longitude: number;
  } | null;
}
