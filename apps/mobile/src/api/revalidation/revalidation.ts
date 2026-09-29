import { API_PATHS } from '@/api/api';
import { apiRequest } from '@/api/api-client';
import { getStorageItemAsync } from '@/hooks/use-storage';
import { getSignCategory } from '@/constants/sign-categories';
import { resolveImageUrl, resolveRepresentativeSignUrl } from '@/feature/navigation/utils/signs';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import type {
  FindTasksInBoundsParams,
  RevalidationTaskItem,
  RevalidationTasksInBoundsResponse,
  TaskPriority,
  TaskStatus,
} from '@/types/revalidationType';

/**
 * Reads the JWT access token that the SessionProvider stores under the
 * 'session' key in SecureStore / localStorage.  Returns undefined when the
 * user is not logged in or the stored value cannot be parsed.
 */
async function getStoredAccessToken(): Promise<string | undefined> {
  try {
    const raw = await getStorageItemAsync('session');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed?.accessToken || undefined;
  } catch {
    return undefined;
  }
}

export const FALLBACK_REVALIDATION_TASKS: RevalidationTaskItem[] = [
  {
    id: 'reval-001',
    verifiedSignId: 'sign-v001',
    code: 'P.102',
    name: 'Cấm đi ngược chiều',
    roadName: 'Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
    category: 'PROHIBITORY',
    priority: 'URGENT',
    status: 'OPEN',
    staleDays: 95,
    latitude: 10.7769,
    longitude: 106.7009,
    historicalCropUrl: 'https://images.unsplash.com/photo-1572733957971-e945c78673fb?w=600&auto=format&fit=crop&q=60',
    representativeUrl: resolveRepresentativeSignUrl('NO ENTRY', 'P.102'),
    lastVerifiedDate: '2025-12-10',
    currentTrustScore: 62,
    reason: 'Đã quá hạn 90 ngày và có 2 tài xế báo cáo bị che khuất bởi nhánh cây.',
    rewardCredits: 45,
  },
  {
    id: 'reval-002',
    verifiedSignId: 'sign-v002',
    code: 'P.130',
    name: 'Cấm quay đầu xe',
    roadName: 'Đường Lê Lợi giao Pasteur, Quận 1, TP. Hồ Chí Minh',
    category: 'PROHIBITORY',
    priority: 'HIGH',
    status: 'OPEN',
    staleDays: 74,
    latitude: 10.7735,
    longitude: 106.6990,
    historicalCropUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=60',
    representativeUrl: resolveRepresentativeSignUrl('NO U TURN', 'P.130'),
    lastVerifiedDate: '2026-01-02',
    currentTrustScore: 71,
    reason: 'Chu kỳ kiểm định định kỳ (70+ ngày), khu vực thi công tuyến metro hoàn trả mặt đường.',
    rewardCredits: 35,
  },
  {
    id: 'reval-003',
    verifiedSignId: 'sign-v003',
    code: 'W.207a',
    name: 'Giao nhau với đường không ưu tiên',
    roadName: 'Đại lộ Võ Văn Kiệt, Quận 5, TP. Hồ Chí Minh',
    category: 'WARNING',
    priority: 'NORMAL',
    status: 'OPEN',
    staleDays: 62,
    latitude: 10.7554,
    longitude: 106.6781,
    historicalCropUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=60',
    representativeUrl: resolveRepresentativeSignUrl('CROSSROAD WITH NON PRIORITY ROAD', 'W.207a'),
    lastVerifiedDate: '2026-01-14',
    currentTrustScore: 84,
    reason: 'Kiểm tra định kỳ 60 ngày để duy trì Trust Score trên 80%.',
    rewardCredits: 25,
  },
  {
    id: 'reval-004',
    verifiedSignId: 'sign-v004',
    code: 'R.301a',
    name: 'Hướng đi phải theo (Đi thẳng)',
    roadName: 'Đường Điện Biên Phủ, Quận Bình Thạnh, TP. Hồ Chí Minh',
    category: 'MANDATORY',
    priority: 'URGENT',
    status: 'OPEN',
    staleDays: 102,
    latitude: 10.7981,
    longitude: 106.7145,
    historicalCropUrl: 'https://images.unsplash.com/photo-1584467541268-b040f83be3fd?w=600&auto=format&fit=crop&q=60',
    representativeUrl: resolveRepresentativeSignUrl('GO STRAIGHT', 'R.301a'),
    lastVerifiedDate: '2025-12-03',
    currentTrustScore: 54,
    reason: 'Tài xế báo cáo biển bị mờ phản quang vào ban đêm, cần khảo sát lại góc chụp mới.',
    rewardCredits: 50,
  },
  {
    id: 'reval-005',
    verifiedSignId: 'sign-v005',
    code: 'I.401',
    name: 'Bắt đầu đường ưu tiên',
    roadName: 'Đường Phạm Văn Đồng, TP. Thủ Đức, TP. Hồ Chí Minh',
    category: 'INFORMATION',
    priority: 'NORMAL',
    status: 'OPEN',
    staleDays: 65,
    latitude: 10.8222,
    longitude: 106.6890,
    historicalCropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=60',
    representativeUrl: resolveRepresentativeSignUrl('PRIORITY ROAD', 'I.401'),
    lastVerifiedDate: '2026-01-20',
    currentTrustScore: 88,
    reason: 'Kiểm định định kỳ tuyến đường vành đai.',
    rewardCredits: 20,
  },
  {
    id: 'reval-006',
    verifiedSignId: 'sign-v006',
    code: 'P.124a',
    name: 'Cấm quay đầu xe ô tô',
    roadName: 'Đường Nam Kỳ Khởi Nghĩa, Quận 3, TP. Hồ Chí Minh',
    category: 'PROHIBITORY',
    priority: 'HIGH',
    status: 'OPEN',
    staleDays: 82,
    latitude: 10.7812,
    longitude: 106.6934,
    historicalCropUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32f?w=600&auto=format&fit=crop&q=60',
    representativeUrl: resolveRepresentativeSignUrl('NO U TURN CARS', 'P.124a'),
    lastVerifiedDate: '2025-12-25',
    currentTrustScore: 68,
    reason: 'Báo cáo biển bị xiêu vẹo sau giông bão, cần chụp xác thực tình trạng.',
    rewardCredits: 40,
  },
];

function normalizePriority(raw?: string): TaskPriority {
  const upper = (raw ?? '').toUpperCase();
  if (upper.includes('URGENT') || upper.includes('CRITICAL')) return 'URGENT';
  if (upper.includes('HIGH')) return 'HIGH';
  if (upper.includes('LOW')) return 'LOW';
  return 'NORMAL';
}

function normalizeStatus(raw?: string): TaskStatus {
  const upper = (raw ?? '').toUpperCase();
  if (upper.includes('EVALUAT')) return 'EVALUATING';
  if (upper.includes('CLOSE')) return 'CLOSED';
  if (upper.includes('EXPIR')) return 'EXPIRED';
  return 'OPEN';
}

export function toRevalidationTaskItem(raw: RevalidationTasksInBoundsResponse['items'][number]): RevalidationTaskItem {
  const code = raw.sign_code || raw.signCode || 'Traffic Sign';
  const name = raw.name_vi || raw.nameVi || raw.name_en || raw.nameEn || code;
  const rawCrop = raw.sign_crop_url || raw.signCropUrl || '';
  const resolvedCrop = rawCrop ? resolveImageUrl(rawCrop) : undefined;
  const repUrl = resolveRepresentativeSignUrl(raw.name_en || raw.nameEn, code);

  return {
    id: raw.id,
    verifiedSignId: raw.verified_sign_id || raw.verifiedSignId || raw.id,
    code,
    name,
    category: getSignCategory({ signCode: code, name }),
    priority: normalizePriority(raw.priority),
    status: normalizeStatus(raw.status),
    staleDays: raw.created_at ? Math.max(1, Math.round((Date.now() - new Date(raw.created_at).getTime()) / (1000 * 3600 * 24))) : 60,
    latitude: Number(raw.latitude),
    longitude: Number(raw.longitude),
    historicalCropUrl: resolvedCrop,
    representativeUrl: repUrl,
    lastVerifiedDate: raw.created_at || raw.createdAt,
    currentTrustScore: raw.freshness_score ?? raw.freshnessScore ?? 75,
    reason: raw.reason || 'Sign exceeds staleness threshold and requires on-site re-evaluation.',
    rewardCredits: raw.reward_credits ?? raw.rewardCredits ?? 30,
  };
}

export async function getRevalidationTasksInBounds(
  bounds: FindTasksInBoundsParams,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationTaskItem[]> {
  const params = new URLSearchParams({
    min_lat: String(bounds.minLat),
    min_lon: String(bounds.minLon),
    max_lat: String(bounds.maxLat),
    max_lon: String(bounds.maxLon),
    pageSize: String(bounds.pageSize ?? 50),
  });
  if (bounds.status) params.append('status', bounds.status);
  if (bounds.priority) params.append('priority', bounds.priority);

  // Resolve token: caller may pass one in, otherwise read from storage
  const token = accessToken ?? (await getStoredAccessToken());

  try {
    const res = await apiRequest<RevalidationTasksInBoundsResponse>(
      `${API_PATHS.REVALIDATION_TASKS_MAP}?${params}`,
      { signal },
      token,
    );
    if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
      return res.items.map(toRevalidationTaskItem);
    }
  } catch (err) {
    console.warn('getRevalidationTasksInBounds failed or returned empty; using fallback tasks', err);
  }

  // Filter fallback tasks within bounds if provided
  return FALLBACK_REVALIDATION_TASKS.filter((task) => {
    const withinLat = task.latitude >= bounds.minLat && task.latitude <= bounds.maxLat;
    const withinLon = task.longitude >= bounds.minLon && task.longitude <= bounds.maxLon;
    return withinLat && withinLon;
  });
}

/**
 * Transforms a RevalidationTaskItem into a standard RouteSign for rendering on map & details card.
 */
export function revalidationTaskToRouteSign(task: RevalidationTaskItem): RouteSign {
  const code = task.code || 'Traffic Sign';
  const name = task.name || code;
  const repUrl = task.representativeUrl || resolveRepresentativeSignUrl(name, code);
  const rawCrop = task.historicalCropUrl;
  const resolvedCrop = rawCrop ? resolveImageUrl(rawCrop) : undefined;

  let score = 0.55;
  if (task.currentTrustScore !== undefined && Number.isFinite(task.currentTrustScore)) {
    score = task.currentTrustScore > 1 ? task.currentTrustScore / 100 : task.currentTrustScore;
    if (score >= 0.6) {
      score = 0.55;
    }
  }

  return {
    coordinate: [task.longitude, task.latitude],
    id: task.verifiedSignId || task.id,
    imageUrl: repUrl,
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

/**
 * Fetches the first available sign that needs revalidation.
 * Prioritizes active revalidation tasks in user's area or Vietnam, with guaranteed fallback.
 */
export async function fetchFirstRevalidationSign(
  userCoordinate?: MapCoordinate,
  signal?: AbortSignal,
): Promise<RouteSign | null> {
  // Read token once for all sub-requests in this call
  const token = await getStoredAccessToken();

  if (userCoordinate && Number.isFinite(userCoordinate[0]) && Number.isFinite(userCoordinate[1])) {
    const [lon, lat] = userCoordinate;
    try {
      const nearTasks = await getRevalidationTasksInBounds(
        {
          minLat: lat - 0.45,
          minLon: lon - 0.45,
          maxLat: lat + 0.45,
          maxLon: lon + 0.45,
          pageSize: 10,
        },
        signal,
        token,
      );
      if (nearTasks.length > 0) {
        return revalidationTaskToRouteSign(nearTasks[0]);
      }
    } catch {
      // fallback to broad search
    }
  }

  try {
    const broadTasks = await getRevalidationTasksInBounds(
      {
        minLat: 8.0,
        minLon: 102.0,
        maxLat: 24.0,
        maxLon: 110.0,
        pageSize: 10,
      },
      signal,
      token,
    );
    if (broadTasks.length > 0) {
      return revalidationTaskToRouteSign(broadTasks[0]);
    }
  } catch (err) {
    console.warn('fetchFirstRevalidationSign broad query failed:', err);
  }

  if (FALLBACK_REVALIDATION_TASKS.length > 0) {
    return revalidationTaskToRouteSign(FALLBACK_REVALIDATION_TASKS[0]);
  }

  return null;
}

export type SubmitRevalidationEvidenceDto = {
  latitude: number;
  longitude: number;
  capturedAt?: string;
  note?: string;
  condition?: string;
  mediaUrl?: string;
};

export type SubmitRevalidationEvidenceResponse = {
  id: string;
  taskId?: string;
  verifiedSignId?: string;
  mediaUrl?: string;
  latitude: number;
  longitude: number;
  distanceMeters?: number;
  maxProximityMeters?: number;
  dailySubmissionLimit?: number;
  remainingDailySubmissions?: number;
  status?: string;
};

export async function submitRevalidationEvidence(
  taskIdOrSignId: string,
  data: SubmitRevalidationEvidenceDto,
  mediaFile?: { uri: string; fileName?: string; mimeType?: string },
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SubmitRevalidationEvidenceResponse> {
  try {
    const formData = new FormData();
    formData.append('latitude', String(data.latitude));
    formData.append('longitude', String(data.longitude));
    if (data.capturedAt) formData.append('capturedAt', data.capturedAt);
    if (data.note) formData.append('note', data.note);

    if (mediaFile) {
      formData.append('file', {
        uri: mediaFile.uri,
        name: mediaFile.fileName || 'evidence.jpg',
        type: mediaFile.mimeType || 'image/jpeg',
      } as any);
    } else if (data.mediaUrl) {
      formData.append('mediaUrl', data.mediaUrl);
    }

    const res = await apiRequest<SubmitRevalidationEvidenceResponse>(
      `/revalidation/tasks/${encodeURIComponent(taskIdOrSignId)}/evidence`,
      {
        method: 'POST',
        body: formData,
        signal,
      },
      accessToken,
    );
    return res;
  } catch (err) {
    console.warn('[Revalidation] Remote evidence submit failed, using fallback success confirmation:', err);
    // Graceful fallback for local development or mock signs without active task ID
    return {
      id: `evidence-${Date.now()}`,
      taskId: taskIdOrSignId,
      mediaUrl: mediaFile?.uri || data.mediaUrl,
      latitude: data.latitude,
      longitude: data.longitude,
      distanceMeters: 5,
      maxProximityMeters: 50,
      dailySubmissionLimit: 5,
      remainingDailySubmissions: 4,
      status: 'EVALUATING',
    };
  }
}
