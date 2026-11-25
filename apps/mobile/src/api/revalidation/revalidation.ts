import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import { API_PATHS } from '@/api/api';
import { apiBaseUrl, ApiError, apiRequest } from '@/api/api-client';
import type { RouteSign } from '@/api/navigation/navigation';
import { resolveS3Url } from '@/api/reviews/review-workflow';
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
  RevalidationTaskDetail,
  RevalidationTaskItem,
  RevalidationTasksInBoundsResponse,
  RequestEvidenceRecaptureDto,
  RequestEvidenceRecaptureResponse,
  SignHistoryResponse,
  SubmitRevalidationEvidenceDto,
  SubmitRevalidationEvidenceResponse,
} from '@/types/revalidationType';

import {
  mapRevalidationEvidenceRow,
  normalizeEvidenceResponse,
  revalidationTaskToRouteSign,
  toRevalidationTaskItem,
  type RevalidationEvidenceItem,
} from './revalidation.mapper';
import {
  buildEvidenceFormData,
  buildEvidenceParameters,
  getStoredAccessToken,
  prepareUploadEvidenceMedia,
  resolveEvidenceType,
  type EvidenceMediaFile,
} from './revalidation.media';

export { getSignHistory } from '@/api/sign-map/sign-map';
export { resolveS3Url };
export { revalidationTaskToRouteSign, toRevalidationTaskItem, type RevalidationEvidenceItem };

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
 * Fetches the first available sign that needs revalidation.
 * Prioritizes active revalidation tasks in user's area or Vietnam.
 */
export async function fetchFirstRevalidationSign(
  userCoordinate?: MapCoordinate,
  signal?: AbortSignal,
): Promise<RouteSign | null> {
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

/**
 * Fetches the list of evidence submissions posted for a specific revalidation task.
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
    return Array.isArray(res) ? res.map(mapRevalidationEvidenceRow) : [];
  } catch (err) {
    console.warn(`[Revalidation] Failed to fetch evidences for task ${taskId}:`, err);
    return [];
  }
}

/**
 * Fetches all evidence submissions across all revalidations for a specific verified sign.
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
    return Array.isArray(res) ? res.map(mapRevalidationEvidenceRow) : [];
  } catch (err) {
    console.warn(`[Revalidation] Failed to fetch evidences for sign ${signId}:`, err);
    return [];
  }
}

export async function submitRevalidationEvidence(
  taskIdOrSignId: string,
  data: SubmitRevalidationEvidenceDto,
  mediaFile?: EvidenceMediaFile,
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

  const token = accessToken ?? (await getStoredAccessToken());
  const evidenceType = resolveEvidenceType(data);

  try {
    const uploadMediaFile = await prepareUploadEvidenceMedia(mediaFile);
    const isLocalFile = Boolean(
      Platform.OS !== 'web' &&
      uploadMediaFile?.uri &&
      !uploadMediaFile.uri.startsWith('http://') &&
      !uploadMediaFile.uri.startsWith('https://'),
    );

    if (isLocalFile && uploadMediaFile?.uri) {
      try {
        const url = `${apiBaseUrl()}/revalidation/tasks/${encodeURIComponent(taskIdOrSignId)}/evidence`;
        console.log(
          `[Revalidation] Native uploadAsync -> POST ${url} (file=${uploadMediaFile.uri})`,
        );

        const result = await FileSystem.uploadAsync(url, uploadMediaFile.uri, {
          fieldName: 'file',
          httpMethod: 'POST',
          uploadType: FileSystem.FileSystemUploadType.MULTIPART,
          mimeType: uploadMediaFile.mimeType || 'image/jpeg',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          parameters: buildEvidenceParameters(data, evidenceType),
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
        if (uploadAsyncErr instanceof ApiError) throw uploadAsyncErr;
        console.warn(
          `[Revalidation] Native uploadAsync failed (${uploadAsyncErr?.message || uploadAsyncErr}), falling back to fetch(FormData)...`,
        );
      }
    }

    const formData = await buildEvidenceFormData(data, evidenceType, uploadMediaFile);
    const res = await apiRequest<SubmitRevalidationEvidenceResponse>(
      `/revalidation/tasks/${encodeURIComponent(taskIdOrSignId)}/evidence`,
      { method: 'POST', body: formData, signal },
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
            ? { ...item.verifiedSign, signCropUrl: resolveS3Url(item.verifiedSign.signCropUrl) }
            : item.verifiedSign,
          evidence: item.evidence
            ? { ...item.evidence, mediaUrl: resolveS3Url(item.evidence.mediaUrl) }
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
  const payload: EvidenceVoteDto = {
    decision: dto.decision,
    ...(dto.suggestedSignTypeId !== undefined
      ? { suggestedSignTypeId: dto.suggestedSignTypeId }
      : {}),
    ...(dto.note !== undefined ? { note: dto.note } : {}),
  };

  return apiRequest<EvidenceVoteResponse>(
    `/revalidation/evidence/${encodeURIComponent(evidenceId)}/vote`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
      signal,
    },
    token,
  );
}

/**
 * Fetches revalidation tasks with optional spatial radius, sorting, and pagination.
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
            ...mapRevalidationEvidenceRow(e),
            suggestedSignTypeId:
              e.suggested_sign_type_id != null
                ? Number(e.suggested_sign_type_id)
                : e.suggestedSignTypeId != null
                  ? Number(e.suggestedSignTypeId)
                  : undefined,
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
    { method: 'POST', signal },
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
 * Checks in on-site GPS location before capturing live evidence.
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
      headers: { 'Content-Type': 'application/json' },
      signal,
    },
    token,
  );
}

/**
 * Polls GPS eligibility for a task via GET /api/v1/revalidation/tasks/:taskId/check-in.
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
  const params = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  if (accuracyMeters != null) params.append('accuracyMeters', String(accuracyMeters));

  return apiRequest<RevalidationCheckInResponse>(
    `/revalidation/tasks/${encodeURIComponent(taskId)}/check-in?${params.toString()}`,
    { signal },
    token,
  );
}

/**
 * Request surveyor to recapture evidence photo due to blurriness or obstruction.
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
      headers: { 'Content-Type': 'application/json' },
      signal,
    },
    token,
  );
}

/**
 * Trigger AI early classification on task evidence photo.
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
      headers: { 'Content-Type': 'application/json' },
      signal,
    },
    token,
  );
}
