import { API_PATHS } from '@/api/api';
import { apiBaseUrl, ApiError, apiRequest } from '@/api/api-client';
import { getStorageItemAsync } from '@/hooks/use-storage';
import { getSignCategory } from '@/constants/sign-categories';
import { resolveImageUrl, resolveRepresentativeSignUrl } from '@/feature/navigation/utils/signs';
import { resolveS3Url } from '@/api/reviews/review-workflow';
import { compressAndResizeSurveyImage } from '@/feature/upload/utils/survey-image';
import { Platform } from 'react-native';

export { resolveS3Url };
import * as FileSystem from 'expo-file-system/legacy';
import type { RouteSign } from '@/api/navigation/navigation';
import type { MapCoordinate } from '@/types/navigationType';
import type {
  CheckInEligibilityDto,
  EvidenceVoteDto,
  EvidenceVoteResponse,
  FindTasksInBoundsParams,
  GetRevalidationTasksParams,
  RevalidationCheckInResponse,
  RevalidationDecisionItem,
  RevalidationEvidenceDetailItem,
  RevalidationEvidenceQueueResponse,
  RevalidationEvidenceType,
  RevalidationQueueEvidenceItem,
  RevalidationTaskDetail,
  RevalidationTaskItem,
  RevalidationTasksInBoundsResponse,
  RequestEvidenceRecaptureDto,
  RequestEvidenceRecaptureResponse,
  SignHistoryResponse,
  SubmitRevalidationEvidenceDto,
  SubmitRevalidationEvidenceResponse,
  TaskPriority,
  TaskStatus,
} from '@/types/revalidationType';

export { getSignHistory } from '@/api/sign-map/sign-map';

export type {
  CheckInEligibilityDto,
  GetRevalidationTasksParams,
  RevalidationCheckInResponse,
  RevalidationDecisionItem,
  RevalidationEvidenceDetailItem,
  RevalidationEvidenceType,
  RevalidationTaskDetail,
  RequestEvidenceRecaptureDto,
  RequestEvidenceRecaptureResponse,
  SignHistoryResponse,
  SubmitRevalidationEvidenceDto,
  SubmitRevalidationEvidenceResponse,
};

/**
 * Converts a local file URI (e.g. file://, content://, cache) to a standard Blob
 * compatible with WinterCG fetch and React Native FormData.
 */
async function uriToBlob(uri: string, mimeType = 'image/jpeg'): Promise<Blob> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    if (!blob.type || blob.type === 'text/plain') {
      return new Blob([blob], { type: mimeType });
    }
    return blob;
  } catch (fetchErr) {
    console.warn('[Revalidation] fetch uri to blob failed, falling back to FileSystem base64:', fetchErr);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary = typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
}

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

export function toRevalidationTaskItem(
  raw: RevalidationTasksInBoundsResponse['items'][number],
): RevalidationTaskItem {
  const code = raw.sign_code || raw.signCode || 'Traffic Sign';
  const name = raw.name_vi || raw.nameVi || raw.name_en || raw.nameEn || code;
  const rawCrop = raw.sign_crop_url || raw.signCropUrl || '';
  const resolvedCrop = rawCrop ? resolveImageUrl(rawCrop) : undefined;
  const repUrl = resolveRepresentativeSignUrl(raw.name_en || raw.nameEn, code);

  const rawAny = raw as any;
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
  } catch (err: any) {
    if (
      signal?.aborted ||
      err?.name === 'AbortError' ||
      String(err).includes('canceled') ||
      String(err).includes('aborted')
    ) {
      return [];
    }
    console.warn('getRevalidationTasksInBounds failed or returned empty:', err);
  }

  return [];
}

/**
 * Fetches all available revalidation tasks from the backend (independent of viewport).
 * First attempts to query without bounding box, then falls back to nationwide bounds.
 */
export async function getAllRevalidationTasks(
  params?: { status?: string; priority?: string; pageSize?: number },
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationTaskItem[]> {
  const token = accessToken ?? (await getStoredAccessToken());
  const pageSize = String(params?.pageSize ?? 100);

  // 1. Try querying /revalidation/tasks/map without bbox parameters
  try {
    const searchParams = new URLSearchParams({ pageSize });
    if (params?.status) searchParams.append('status', params.status);
    if (params?.priority) searchParams.append('priority', params.priority);

    const res = await apiRequest<RevalidationTasksInBoundsResponse>(
      `${API_PATHS.REVALIDATION_TASKS_MAP}?${searchParams.toString()}`,
      { signal },
      token,
    );
    if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
      return res.items.map(toRevalidationTaskItem);
    }
  } catch {
    // Continue to next fallback
  }

  // 2. Try querying /revalidation/tasks
  try {
    const searchParams = new URLSearchParams({ page: '1', pageSize });
    if (params?.status) searchParams.append('status', params.status);

    const res = await apiRequest<RevalidationTasksInBoundsResponse>(
      `${API_PATHS.REVALIDATION_TASKS}?${searchParams.toString()}`,
      { signal },
      token,
    );
    if (res?.items && Array.isArray(res.items) && res.items.length > 0) {
      return res.items.map(toRevalidationTaskItem);
    }
  } catch {
    // Continue to broad country bounds fallback
  }

  // 3. Fallback: query /revalidation/tasks/map with Vietnam-wide bounds
  try {
    const res = await getRevalidationTasksInBounds(
      {
        minLat: 8.0,
        minLon: 102.0,
        maxLat: 24.0,
        maxLon: 110.0,
        pageSize: params?.pageSize ?? 100,
        status: params?.status,
        priority: params?.priority,
      },
      signal,
      token,
    );
    if (res && res.length > 0) {
      return res;
    }
  } catch (err) {
    console.warn('getAllRevalidationTasks fallback failed:', err);
  }

  return [];
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
  }

  const rawLat = Number(task.latitude);
  const rawLon = Number(task.longitude);
  const validLat = Number.isFinite(rawLat) && rawLat >= -90 && rawLat <= 90 ? rawLat : 10.7769;
  const validLon = Number.isFinite(rawLon) && rawLon >= -180 && rawLon <= 180 ? rawLon : 106.6955;

  return {
    coordinate: [validLon, validLat],
    id: task.verifiedSignId || task.id,
    taskId: task.id,
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
 * Prioritizes active revalidation tasks in user's area or Vietnam.
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

  return null;
}

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

/**
 * Fetches the list of evidence submissions (reviews) posted for a specific revalidation task.
 */
export async function getTaskEvidences(
  taskId: string,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationEvidenceItem[]> {
  const token = accessToken ?? (await getStoredAccessToken());
  try {
    const res = await apiRequest<RevalidationEvidenceItem[]>(
      `/revalidation/tasks/${encodeURIComponent(taskId)}/evidences`,
      { signal },
      token,
    );
    if (!Array.isArray(res)) return [];
    return res.map((row: any) => ({
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
    }));
  } catch (err) {
    console.warn(`[Revalidation] Failed to fetch evidences for task ${taskId}:`, err);
    return [];
  }
}

/**
 * Fetches all evidence submissions (reviews and photos) across all revalidations for a specific verified sign.
 */
export async function getSignEvidences(
  signId: string,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationEvidenceItem[]> {
  const token = accessToken ?? (await getStoredAccessToken());
  try {
    const res = await apiRequest<RevalidationEvidenceItem[]>(
      `/revalidation/signs/${encodeURIComponent(signId)}/evidences`,
      { signal },
      token,
    );
    if (!Array.isArray(res)) return [];
    return res.map((row: any) => ({
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
    }));
  } catch (err) {
    console.warn(`[Revalidation] Failed to fetch evidences for sign ${signId}:`, err);
    return [];
  }
}

function normalizeEvidenceResponse(body: unknown): SubmitRevalidationEvidenceResponse {
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

export async function submitRevalidationEvidence(
  taskIdOrSignId: string,
  data: SubmitRevalidationEvidenceDto,
  mediaFile?: { uri: string; fileName?: string; mimeType?: string },
  accessToken?: string,
  signal?: AbortSignal,
): Promise<SubmitRevalidationEvidenceResponse> {
  if (
    !taskIdOrSignId ||
    taskIdOrSignId === 'undefined' ||
    taskIdOrSignId === 'null' ||
    taskIdOrSignId === 'sign-target' ||
    taskIdOrSignId.trim() === ''
  ) {
    throw new ApiError('Mã nhiệm vụ tái thẩm định (taskId/signId) không hợp lệ.', 400);
  }

  // Resolve token: caller may pass one in, otherwise read from storage
  const token = accessToken ?? (await getStoredAccessToken());
  let evidenceType: RevalidationEvidenceType = 'STILL_ACTIVE';
  if (data.evidenceType) {
    evidenceType = data.evidenceType;
  } else if (data.condition === 'REMOVED' || data.condition === 'MISSING') {
    evidenceType = 'REMOVED';
  } else if (data.condition === 'CHANGED' || data.condition === 'REPLACED') {
    evidenceType = 'CHANGED';
  }

  try {
    let uploadMediaFile = mediaFile;
    if (
      mediaFile?.uri &&
      !mediaFile.mimeType?.startsWith('video/') &&
      !mediaFile.uri.startsWith('http://') &&
      !mediaFile.uri.startsWith('https://')
    ) {
      try {
        const compressed = await compressAndResizeSurveyImage(mediaFile.uri);
        if (compressed.uri) {
          uploadMediaFile = {
            ...mediaFile,
            uri: compressed.uri,
            fileName: mediaFile.fileName
              ? !mediaFile.fileName.toLowerCase().endsWith('.jpg') &&
                !mediaFile.fileName.toLowerCase().endsWith('.jpeg')
                ? `${mediaFile.fileName.replace(/\.[^/.]+$/, '')}.jpg`
                : mediaFile.fileName
              : 'evidence.jpg',
            mimeType: 'image/jpeg',
          };
        }
      } catch (compErr) {
        console.warn('[Revalidation] Image downsize skipped or failed, using original:', compErr);
      }
    }

    const isLocalFile = Boolean(
      Platform.OS !== 'web' &&
      uploadMediaFile?.uri &&
      !uploadMediaFile.uri.startsWith('http://') &&
      !uploadMediaFile.uri.startsWith('https://'),
    );

    // On native platforms (Android & iOS), first attempt FileSystem.uploadAsync.
    // If uploadAsync encounters HTTP/2 connection or stream reset issues (e.g. PROTOCOL_ERROR from proxy),
    // it automatically falls back to standard fetch(FormData) with uriToBlob.
    if (isLocalFile && uploadMediaFile?.uri) {
      try {
        const baseUrl = apiBaseUrl();
        const url = `${baseUrl}/revalidation/tasks/${encodeURIComponent(taskIdOrSignId)}/evidence`;
        console.log(`[Revalidation] Native uploadAsync -> POST ${url} (file=${uploadMediaFile.uri})`);

        const parameters: Record<string, string> = {
          latitude: String(data.latitude),
          longitude: String(data.longitude),
        };
        if (evidenceType) parameters.evidenceType = evidenceType;
        if (
          typeof data.accuracyMeters === 'number' &&
          Number.isFinite(data.accuracyMeters) &&
          data.accuracyMeters >= 0
        ) {
          parameters.accuracyMeters = String(Math.round(data.accuracyMeters * 10) / 10);
        }
        if (data.capturedAt) {
          const parsedTime = new Date(data.capturedAt).getTime();
          parameters.capturedAt = !Number.isNaN(parsedTime)
            ? new Date(parsedTime).toISOString()
            : data.capturedAt;
        }
        if (data.confirmedSignId) {
          parameters.confirmedSignId = data.confirmedSignId;
        }
        if (
          typeof data.headingDegrees === 'number' &&
          Number.isFinite(data.headingDegrees) &&
          data.headingDegrees >= 0 &&
          data.headingDegrees <= 360
        ) {
          parameters.headingDegrees = String(Math.round(data.headingDegrees));
        }
        if (typeof data.isLiveCapture === 'boolean') {
          parameters.isLiveCapture = String(data.isLiveCapture);
        }
        if (data.suggestedSignTypeId != null && !Number.isNaN(Number(data.suggestedSignTypeId))) {
          parameters.suggestedSignTypeId = String(Math.round(Number(data.suggestedSignTypeId)));
        }
        if (data.mediaUrl) {
          parameters.mediaUrl = data.mediaUrl;
        }

        const result = await FileSystem.uploadAsync(url, uploadMediaFile.uri, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: uploadMediaFile.mimeType || 'image/jpeg',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          parameters,
        });

        let body: unknown;
        try {
          body = JSON.parse(result.body);
        } catch {
          body = result.body;
        }

        if (result.status >= 200 && result.status < 300) {
          console.log(`[Revalidation] Native uploadAsync <- [HTTP ${result.status}] OK`);
          return normalizeEvidenceResponse(body);
        }

        console.error(`[Revalidation] Native uploadAsync FAILED [HTTP ${result.status}]:`, body);
        const message =
          typeof body === 'object' && body && 'message' in body
            ? Array.isArray((body as any).message)
              ? (body as any).message.join(', ')
              : String((body as any).message)
            : `Tải minh chứng lên thất bại với mã trạng thái ${result.status}`;
        throw new ApiError(message, result.status, body);
      } catch (uploadAsyncErr: any) {
        if (uploadAsyncErr instanceof ApiError) {
          throw uploadAsyncErr;
        }
        console.warn(
          `[Revalidation] Native uploadAsync failed (${uploadAsyncErr?.message || uploadAsyncErr}), falling back to fetch(FormData)...`,
        );
      }
    }

    // Web, URL-only, or Native fallback when uploadAsync encounters stream reset / transport error
    const formData = new FormData();
    formData.append('latitude', String(data.latitude));
    formData.append('longitude', String(data.longitude));
    if (evidenceType) formData.append('evidenceType', evidenceType);
    if (
      typeof data.accuracyMeters === 'number' &&
      Number.isFinite(data.accuracyMeters) &&
      data.accuracyMeters >= 0
    ) {
      formData.append('accuracyMeters', String(Math.round(data.accuracyMeters * 10) / 10));
    }
    if (data.capturedAt) {
      const parsedTime = new Date(data.capturedAt).getTime();
      formData.append(
        'capturedAt',
        !Number.isNaN(parsedTime) ? new Date(parsedTime).toISOString() : data.capturedAt,
      );
    }
    if (data.confirmedSignId) {
      formData.append('confirmedSignId', data.confirmedSignId);
    }
    if (
      typeof data.headingDegrees === 'number' &&
      Number.isFinite(data.headingDegrees) &&
      data.headingDegrees >= 0 &&
      data.headingDegrees <= 360
    ) {
      formData.append('headingDegrees', String(Math.round(data.headingDegrees)));
    }
    if (typeof data.isLiveCapture === 'boolean') {
      formData.append('isLiveCapture', String(data.isLiveCapture));
    }
    if (data.suggestedSignTypeId != null && !Number.isNaN(Number(data.suggestedSignTypeId))) {
      formData.append('suggestedSignTypeId', String(Math.round(Number(data.suggestedSignTypeId))));
    }
    if (data.questClaimId) {
      formData.append('questClaimId', data.questClaimId);
    }

    if (uploadMediaFile) {
      if (typeof File !== 'undefined' && (uploadMediaFile as unknown) instanceof File) {
        formData.append('file', uploadMediaFile as unknown as Blob);
      } else if (
        uploadMediaFile.uri &&
        (uploadMediaFile.uri.startsWith('blob:') || uploadMediaFile.uri.startsWith('data:'))
      ) {
        const blob = await fetch(uploadMediaFile.uri).then((r) => r.blob());
        formData.append('file', blob, uploadMediaFile.fileName || 'evidence.jpg');
      } else if (
        uploadMediaFile.uri &&
        (uploadMediaFile.uri.startsWith('http://') || uploadMediaFile.uri.startsWith('https://'))
      ) {
        formData.append('mediaUrl', uploadMediaFile.uri);
      } else if (uploadMediaFile.uri) {
        try {
          const blob = await uriToBlob(
            uploadMediaFile.uri,
            uploadMediaFile.mimeType || 'image/jpeg',
          );
          formData.append('file', blob, uploadMediaFile.fileName || 'evidence.jpg');
        } catch (blobErr) {
          console.warn('[Revalidation] uriToBlob fallback to object descriptor:', blobErr);
          formData.append('file', {
            uri: uploadMediaFile.uri,
            name: uploadMediaFile.fileName || 'evidence.jpg',
            type: uploadMediaFile.mimeType || 'image/jpeg',
          } as any);
        }
      }
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
      token,
    );
    return normalizeEvidenceResponse(res);
  } catch (err) {
    console.error('[Revalidation] Remote evidence submit failed:', err);
    throw err;
  }
}

/**
 * Fetches the queue of revalidation evidence awaiting reviewer consensus.
 * Automatically excludes evidence the requesting reviewer has already judged or submitted.
 */
export async function getRevalidationEvidenceQueue(
  params?: { page?: number; pageSize?: number },
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationEvidenceQueueResponse> {
  const token = accessToken ?? (await getStoredAccessToken());
  const searchParams = new URLSearchParams({
    page: String(params?.page ?? 1),
    pageSize: String(params?.pageSize ?? 20),
  });

  try {
    const res = await apiRequest<RevalidationEvidenceQueueResponse>(
      `${API_PATHS.REVALIDATION_EVIDENCE_QUEUE}?${searchParams.toString()}`,
      { signal },
      token,
    );
    if (res?.items && Array.isArray(res.items)) {
      return {
        ...res,
        items: res.items.map((item) => ({
          ...item,
          verifiedSign: item.verifiedSign
            ? {
                ...item.verifiedSign,
                signCropUrl: resolveS3Url(item.verifiedSign.signCropUrl),
              }
            : item.verifiedSign,
          evidence: item.evidence
            ? {
                ...item.evidence,
                mediaUrl: resolveS3Url(item.evidence.mediaUrl),
              }
            : item.evidence,
        })),
      };
    }
  } catch (err) {
    console.warn('[Revalidation] Failed to fetch evidence queue from server:', err);
  }

  return {
    items: [],
    total: 0,
    page: params?.page ?? 1,
    pageSize: params?.pageSize ?? 20,
    totalPages: 0,
  };
}

/**
 * Casts a consensus vote on a submitted revalidation evidence item.
 */
export async function voteOnRevalidationEvidence(
  evidenceId: string,
  dto: EvidenceVoteDto,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<EvidenceVoteResponse> {
  const token = accessToken ?? (await getStoredAccessToken());
  return apiRequest<EvidenceVoteResponse>(
    `/revalidation/evidence/${encodeURIComponent(evidenceId)}/vote`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    },
    token,
  );
}

/**
 * Fetches revalidation tasks with optional spatial radius, sorting, and pagination.
 * Supports /revalidation/tasks backend endpoint.
 */
export async function getRevalidationTasks(
  params?: GetRevalidationTasksParams,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationTasksInBoundsResponse> {
  const token = accessToken ?? (await getStoredAccessToken());
  const searchParams = new URLSearchParams();
  if (params?.page != null) searchParams.append('page', String(params.page));
  if (params?.pageSize != null) searchParams.append('pageSize', String(params.pageSize));
  if (params?.status) searchParams.append('status', params.status);
  if (params?.sort) searchParams.append('sort', params.sort);
  if (params?.lat != null) searchParams.append('lat', String(params.lat));
  if (params?.lon != null) searchParams.append('lon', String(params.lon));
  if (params?.radiusMeters != null)
    searchParams.append('radiusMeters', String(params.radiusMeters));

  const qs = searchParams.toString();
  const url = `${API_PATHS.REVALIDATION_TASKS}${qs ? `?${qs}` : ''}`;
  try {
    const res = await apiRequest<RevalidationTasksInBoundsResponse>(url, { signal }, token);
    const rawItems = Array.isArray(res?.items) ? res.items : [];
    return {
      items: rawItems,
      total: res?.total ?? rawItems.length,
      page: res?.page ?? params?.page ?? 1,
      pageSize: res?.pageSize ?? params?.pageSize ?? rawItems.length,
      totalPages: res?.totalPages ?? 1,
    };
  } catch (err) {
    console.warn('[Revalidation] Failed to fetch revalidation tasks:', err);
    return { items: [], total: 0, page: 1, pageSize: 0, totalPages: 0 };
  }
}

/**
 * Fetches full task details for a specific revalidation task including location and submitted evidences.
 */
export async function getRevalidationTask(
  taskId: string,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationTaskDetail | null> {
  const token = accessToken ?? (await getStoredAccessToken());
  try {
    const res = await apiRequest<any>(
      `/revalidation/tasks/${encodeURIComponent(taskId)}`,
      { signal },
      token,
    );
    if (!res) return null;
    const base = toRevalidationTaskItem(res as any);
    return {
      ...base,
      ...res,
      id: base.id,
      code: base.code,
      name: base.name,
      category: base.category,
      priority: base.priority,
      status: base.status,
      latitude: res.location?.lat != null ? Number(res.location.lat) : base.latitude,
      longitude: res.location?.lon != null ? Number(res.location.lon) : base.longitude,
      signCropUrl: resolveS3Url(res.sign_crop_url ?? res.signCropUrl),
      historicalCropUrl: resolveS3Url(
        res.historical_crop_url ?? res.historicalCropUrl ?? res.sign_crop_url ?? res.signCropUrl,
      ),
      evidences: Array.isArray(res.evidences)
        ? res.evidences.map((e: any) => ({
            id: e.id,
            taskId: e.task_id ?? e.taskId,
            surveyorId: e.user_id ?? e.userId,
            mediaUrl: resolveS3Url(e.media_url ?? e.mediaUrl),
            evidenceType: e.evidence_type ?? e.evidenceType ?? 'STILL_ACTIVE',
            suggestedSignTypeId:
              e.suggested_sign_type_id != null
                ? Number(e.suggested_sign_type_id)
                : e.suggestedSignTypeId != null
                  ? Number(e.suggestedSignTypeId)
                  : undefined,
            submittedAt: e.submitted_at ?? e.submittedAt,
            capturedAt: e.captured_at ?? e.capturedAt ?? e.submitted_at,
            locationWkt: e.location_wkt ?? e.locationWkt,
            distanceMeters:
              e.distance_meters != null ? Number(e.distance_meters) : e.distanceMeters,
            status: e.status,
          }))
        : [],
    };
  } catch (err) {
    console.warn(`[Revalidation] Failed to fetch task ${taskId}:`, err);
    return null;
  }
}

/**
 * Staff / Admin finalization of a revalidation task.
 */
export async function finalizeRevalidationTask(
  taskId: string,
  accessToken?: string,
  signal?: AbortSignal,
): Promise<EvidenceVoteResponse['consensus']> {
  const token = accessToken ?? (await getStoredAccessToken());
  return apiRequest<EvidenceVoteResponse['consensus']>(
    `/revalidation/tasks/${encodeURIComponent(taskId)}/finalize`,
    {
      method: 'POST',
      signal,
    },
    token,
  );
}

/**
 * Fetches historical consensus decisions for a specific evidence item.
 */
export async function getEvidenceDecisions(
  evidenceId: string,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationDecisionItem[]> {
  const token = accessToken ?? (await getStoredAccessToken());
  try {
    const res = await apiRequest<RevalidationDecisionItem[]>(
      `/revalidation/evidence/${encodeURIComponent(evidenceId)}/decisions`,
      { signal },
      token,
    );
    return Array.isArray(res) ? res : [];
  } catch (err) {
    console.warn(`[Revalidation] Failed to fetch decisions for evidence ${evidenceId}:`, err);
    return [];
  }
}

/**
 * Checks in on-site GPS location before capturing live evidence (POST /api/v1/revalidation/tasks/:taskId/check-in).
 * Validates proximity (< 50m) and 24-hour daily task submission limits.
 */
export async function checkInRevalidationTask(
  taskId: string,
  dto: CheckInEligibilityDto,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationCheckInResponse> {
  const token = accessToken ?? (await getStoredAccessToken());
  return apiRequest<RevalidationCheckInResponse>(
    `/revalidation/tasks/${encodeURIComponent(taskId)}/check-in`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    },
    token,
  );
}

/**
 * Polls GPS eligibility for a task via GET /api/v1/revalidation/tasks/:taskId/check-in?lat=&lon=&accuracyMeters=
 */
export async function getCheckInEligibility(
  taskId: string,
  lat: number,
  lon: number,
  accuracyMeters?: number,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RevalidationCheckInResponse> {
  const token = accessToken ?? (await getStoredAccessToken());
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
  });
  if (accuracyMeters != null) params.append('accuracyMeters', String(accuracyMeters));

  return apiRequest<RevalidationCheckInResponse>(
    `/revalidation/tasks/${encodeURIComponent(taskId)}/check-in?${params.toString()}`,
    { signal },
    token,
  );
}

/**
 * Request surveyor to recapture evidence photo due to blurriness or obstruction.
 * POST /api/v1/revalidation/evidence/:evidenceId/request-recapture
 */
export async function requestEvidenceRecapture(
  evidenceId: string,
  dto: RequestEvidenceRecaptureDto,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<RequestEvidenceRecaptureResponse> {
  const token = accessToken ?? (await getStoredAccessToken());
  return apiRequest<RequestEvidenceRecaptureResponse>(
    `/revalidation/evidence/${encodeURIComponent(evidenceId)}/request-recapture`,
    {
      method: 'POST',
      body: JSON.stringify(dto),
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    },
    token,
  );
}

/**
 * Trigger AI early classification on task evidence photo.
 * POST /api/v1/revalidation/tasks/:taskId/early-classify
 */
export async function earlyClassifyRevalidationTask(
  taskId: string,
  mediaUrl?: string,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<{
  success: boolean;
  earlyClassification?: {
    className?: string;
    standardCode?: string;
    confidence?: number;
    boundingBox?: any;
    trafficSignTypeId?: number;
  };
  resolvedSignTypeId?: number | null;
}> {
  const token = accessToken ?? (await getStoredAccessToken());
  return apiRequest(
    `/revalidation/tasks/${encodeURIComponent(taskId)}/early-classify`,
    {
      method: 'POST',
      body: JSON.stringify({ mediaUrl }),
      headers: {
        'Content-Type': 'application/json',
      },
      signal,
    },
    token,
  );
}

