import type { RouteSign } from '@/api/navigation/navigation';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { getSignCategory } from '@/constants/sign-categories';
import { resolveImageUrl, resolveRepresentativeSignUrl } from '@/feature/navigation/utils/signs';
import type {
  RevalidationEvidenceType,
  RevalidationTaskItem,
  RevalidationTasksInBoundsResponse,
  SubmitRevalidationEvidenceResponse,
  TaskPriority,
  TaskStatus,
} from '@/types/revalidationType';

export type RevalidationEvidenceItem = {
  id: string;
  taskId?: string;
  mediaUrl?: string;
  latitude?: number;
  longitude?: number;
  capturedAt?: string;
  submittedAt?: string;
  evidenceType?: RevalidationEvidenceType | string;
  status?: string;
  createdAt?: string;
  distanceMeters?: number;
  surveyorId?: string;
  note?: string;
};

export function normalizePriority(raw?: string): TaskPriority {
  const upper = (raw ?? '').toUpperCase();
  if (upper.includes('URGENT') || upper.includes('CRITICAL')) return 'URGENT';
  if (upper.includes('HIGH')) return 'HIGH';
  if (upper.includes('LOW')) return 'LOW';
  return 'NORMAL';
}

export function normalizeStatus(raw?: string): TaskStatus {
  const upper = (raw ?? '').toUpperCase();
  if (upper.includes('EVALUAT')) return 'EVALUATING';
  if (upper.includes('CLOSE')) return 'CLOSED';
  if (upper.includes('EXPIR')) return 'EXPIRED';
  return 'OPEN';
}

export function toRevalidationTaskItem(
  raw: RevalidationTasksInBoundsResponse['items'][number],
): RevalidationTaskItem {
  const rawAny = raw as any;
  const rawSignType = rawAny.signType ?? rawAny.sign_type;
  const code =
    raw.sign_code ||
    raw.signCode ||
    rawSignType?.signCode ||
    rawSignType?.sign_code ||
    'Traffic Sign';
  const nameEn = raw.name_en || raw.nameEn || rawSignType?.nameEn || rawSignType?.name_en;
  const name =
    raw.name_vi || raw.nameVi || rawSignType?.nameVi || rawSignType?.name_vi || nameEn || code;
  const rawCrop =
    raw.sign_crop_url || raw.signCropUrl || rawAny.cropUrl || rawAny.crop_url || '';
  const resolvedCrop = rawCrop ? resolveImageUrl(rawCrop) : undefined;
  const repUrl = resolveRepresentativeSignUrl(nameEn, code === 'Traffic Sign' ? undefined : code);

  const rawLat =
    raw.latitude ?? rawAny.lat ?? rawAny.location?.lat ?? rawAny.location?.latitude ?? rawAny.y;
  const rawLon =
    raw.longitude ??
    rawAny.lon ??
    rawAny.lng ??
    rawAny.location?.lon ??
    rawAny.location?.lng ??
    rawAny.location?.longitude ??
    rawAny.x;

  const parsedLat = Number(rawLat);
  const parsedLon = Number(rawLon);
  const latitude =
    Number.isFinite(parsedLat) && parsedLat >= -90 && parsedLat <= 90 ? parsedLat : 10.7769;
  const longitude =
    Number.isFinite(parsedLon) && parsedLon >= -180 && parsedLon <= 180 ? parsedLon : 106.6955;

  return {
    id: raw.id,
    verifiedSignId: raw.verified_sign_id || raw.verifiedSignId || raw.id,
    code,
    name,
    category: getSignCategory({ signCode: code, name }),
    priority: normalizePriority(raw.priority),
    status: normalizeStatus(raw.status),
    staleDays: raw.created_at
      ? Math.max(
          1,
          Math.round((Date.now() - new Date(raw.created_at).getTime()) / (1000 * 3600 * 24)),
        )
      : 60,
    latitude,
    longitude,
    historicalCropUrl: resolvedCrop,
    representativeUrl: repUrl,
    lastVerifiedDate: raw.created_at || raw.createdAt,
    currentTrustScore: raw.freshness_score ?? raw.freshnessScore ?? 75,
    reason: raw.reason || 'Sign exceeds staleness threshold and requires on-site re-evaluation.',
    rewardCredits: raw.reward_credits ?? raw.rewardCredits ?? (raw as any).bounty ?? 30,
  };
}

/**
 * Transforms a RevalidationTaskItem into a standard RouteSign for rendering on map & details card.
 */
export function revalidationTaskToRouteSign(task: RevalidationTaskItem): RouteSign {
  const code = task.code || 'Traffic Sign';
  const name = task.name || code;
  const repUrl =
    task.representativeUrl ||
    resolveRepresentativeSignUrl(name, code === 'Traffic Sign' ? undefined : code);
  const rawCrop = task.historicalCropUrl;
  const resolvedCrop = rawCrop ? resolveImageUrl(rawCrop) : undefined;

  let score = 0.55;
  if (task.currentTrustScore !== undefined && Number.isFinite(task.currentTrustScore)) {
    score = task.currentTrustScore > 1 ? task.currentTrustScore / 100 : task.currentTrustScore;
  }

  const rawLat = Number(task.latitude);
  const rawLon = Number(task.longitude);
  const validLat = Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : 10.7769;
  const validLon = Number.isFinite(rawLon) && rawLon >= -180 && rawLon <= 180 ? rawLon : 106.6955;

  return {
    coordinate: [validLon, validLat],
    id: task.verifiedSignId || task.id,
    taskId: task.id,
    imageUrl: repUrl || resolvedCrop || '',
    actualCropUrl: resolvedCrop,
    name,
    nameVi: task.name,
    nameEn: task.name,
    signCode: code,
    freshnessScore: score,
    status: 'STALE',
    roadName: task.roadName || 'Ho Chi Minh City, Vietnam',
    displayAddress: task.roadName || 'Ho Chi Minh City, Vietnam',
    lastVerifiedAt: task.lastVerifiedDate,
  };
}

export function mapRevalidationEvidenceRow(row: any): RevalidationEvidenceItem {
  return {
    id: row.id,
    taskId: row.task_id ?? row.taskId,
    surveyorId: row.user_id ?? row.userId ?? row.surveyorId,
    mediaUrl: resolveS3Url(row.media_url ?? row.mediaUrl),
    evidenceType: row.evidence_type ?? row.evidenceType ?? 'STILL_ACTIVE',
    submittedAt: row.submitted_at ?? row.submittedAt,
    capturedAt: row.captured_at ?? row.capturedAt ?? row.submitted_at ?? row.submittedAt,
    locationWkt: row.location_wkt ?? row.locationWkt,
    distanceMeters:
      row.distance_meters != null ? Number(row.distance_meters) : row.distanceMeters,
    note: row.note,
    status: row.status,
  } as RevalidationEvidenceItem;
}

export function normalizeEvidenceResponse(body: unknown): SubmitRevalidationEvidenceResponse {
  const res = body as SubmitRevalidationEvidenceResponse;
  if (res && typeof res === 'object') {
    const rawUrl = res.mediaUrl ?? (res as any).media_url;
    return {
      ...res,
      mediaUrl: rawUrl ? resolveS3Url(rawUrl) : undefined,
    };
  }
  return res;
}
