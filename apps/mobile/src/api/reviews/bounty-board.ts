import { API_PATHS } from '@/api/api';
import { apiRequest, jsonApiRequest } from '@/api/api-client';
import type {
  BountyQuestItem,
  CandidateCheckInResponse,
  ClaimQuestDto,
  QueryAvailableQuestsParams,
  QueryMyClaimsParams,
  ReviewerQuestClaim,
} from '@/types/bountyBoardType';

export function getAvailableQuests(
  params: QueryAvailableQuestsParams,
  accessToken: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (params.latitude != null) query.set('latitude', String(params.latitude));
  if (params.longitude != null) query.set('longitude', String(params.longitude));
  if (params.radiusKm != null) query.set('radiusKm', String(params.radiusKm));
  if (params.targetType) query.set('targetType', params.targetType);

  const qs = query.toString();
  return apiRequest<BountyQuestItem[]>(
    `${API_PATHS.REVIEWS}/bounty-board/available${qs ? `?${qs}` : ''}`,
    { signal },
    accessToken,
  );
}

export function getMyClaims(
  accessToken: string,
  params?: QueryMyClaimsParams,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.targetType) query.set('targetType', params.targetType);
  if (params?.latitude != null) query.set('latitude', String(params.latitude));
  if (params?.longitude != null) query.set('longitude', String(params.longitude));

  const qs = query.toString();
  return apiRequest<ReviewerQuestClaim[]>(
    `${API_PATHS.REVIEWS}/bounty-board/my-claims${qs ? `?${qs}` : ''}`,
    { signal },
    accessToken,
  );
}

export function claimQuest(
  dto: ClaimQuestDto,
  accessToken: string,
  signal?: AbortSignal,
) {
  return jsonApiRequest<ReviewerQuestClaim>(
    `${API_PATHS.REVIEWS}/bounty-board/claim`,
    dto,
    accessToken,
    signal,
  );
}

export function abandonQuest(
  claimId: string,
  reason: string | undefined,
  accessToken: string,
  signal?: AbortSignal,
) {
  return jsonApiRequest<ReviewerQuestClaim>(
    `${API_PATHS.REVIEWS}/bounty-board/${encodeURIComponent(claimId)}/abandon`,
    { reason },
    accessToken,
    signal,
  );
}

export function checkInCandidate(
  candidateId: string,
  coords: { lat: number; lon: number; accuracyMeters?: number },
  accessToken: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    lat: String(coords.lat),
    lon: String(coords.lon),
  });
  if (coords.accuracyMeters != null) {
    query.set('accuracyMeters', String(coords.accuracyMeters));
  }

  return apiRequest<CandidateCheckInResponse>(
    `${API_PATHS.REVIEWS}/candidates/${encodeURIComponent(candidateId)}/check-in?${query}`,
    { signal },
    accessToken,
  );
}
