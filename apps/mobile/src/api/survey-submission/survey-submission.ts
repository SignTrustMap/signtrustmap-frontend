import { API_PATHS } from '@/api/api';

import { apiRequest, jsonApiRequest } from '@/api/api-client';
import type {
  CompleteUploadResponse,
  CreateSubmissionDto,
  CreateSubmissionResponse,
  InitializeUploadDto,
  InitializeUploadResponse,
  ListMySubmissionsParams,
  ListMySubmissionsResponse,
  PendingSubmissionsResponse,
  SubmissionStatusResponse,
  SubmitSubmissionResponse,
  SurveyorStatsResponse,
  UploadChunkRequest,
  UploadChunkResponse,
  UploadSessionResponse,
  UpdateSubmissionDto,
  UpdateSubmissionResponse,
} from '@/types/survey-submission/surveySubmissionType';

/** The list is newest-first; search subsequent pages when recent items are submitted. */
export async function getLatestSurveyDraft(accessToken: string, signal?: AbortSignal) {
  let page = 1;
  while (true) {
    const result = await getMySubmissions({ page: String(page), pageSize: '50' }, accessToken, signal);
    const draft = result.items.find((item) => item.status === 'DRAFT' && item.submissionType === 'SINGLE_IMAGE');
    if (draft) return draft;
    if (!result.items.length || page >= result.totalPages) return null;
    page += 1;
  }
}

export function createSurveySubmission(
  request: CreateSubmissionDto,
  accessToken: string,
  signal?: AbortSignal,
): Promise<CreateSubmissionResponse> {
  return jsonApiRequest<CreateSubmissionResponse>(
    API_PATHS.SUBMISSIONS, request, accessToken, signal,
  );
}

export function updateSurveySubmission(
  submissionId: string,
  request: UpdateSubmissionDto,
  accessToken: string,
  signal?: AbortSignal,
): Promise<UpdateSubmissionResponse> {
  return apiRequest<UpdateSubmissionResponse>(
    `${API_PATHS.SUBMISSIONS}/${encodeURIComponent(submissionId)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal,
    },
    accessToken,
  );
}

export function initializeSurveyUpload(
  submissionId: string,
  request: InitializeUploadDto,
  accessToken: string,
  signal?: AbortSignal,
): Promise<InitializeUploadResponse> {
  return jsonApiRequest<InitializeUploadResponse>(
    `${API_PATHS.SUBMISSIONS}/${encodeURIComponent(submissionId)}/uploads`, request, accessToken, signal,
  );
}

export function uploadSurveyChunk(
  sessionId: string,
  request: UploadChunkRequest,
  accessToken: string,
  signal?: AbortSignal,
): Promise<UploadChunkResponse> {
  const form = new FormData();
  if ('uri' in request.file) {
    // React Native accepts URI file descriptors; DOM FormData types only list Blob.
    form.append('file', request.file as unknown as Blob);
  } else if (request.fileName !== undefined) {
    form.append('file', request.file, request.fileName);
  } else {
    form.append('file', request.file);
  }
  form.append('chunkIndex', String(request.chunkIndex));
  if (request.checksum !== undefined) form.append('checksum', request.checksum);

  // Let fetch supply the multipart boundary in Content-Type.
  return apiRequest<UploadChunkResponse>(
    `${API_PATHS.SUBMISSIONS}/uploads/${encodeURIComponent(sessionId)}/chunks`,
    { method: 'POST', body: form, signal },
    accessToken,
  );
}

export function completeSurveyUpload(
  sessionId: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<CompleteUploadResponse> {
  return apiRequest<CompleteUploadResponse>(
    `${API_PATHS.SUBMISSIONS}/uploads/${encodeURIComponent(sessionId)}/complete`,
    { method: 'POST', signal },
    accessToken,
  );
}

export function submitSurveySubmission(
  submissionId: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<SubmitSubmissionResponse> {
  return apiRequest<SubmitSubmissionResponse>(
    `${API_PATHS.SUBMISSIONS}/${encodeURIComponent(submissionId)}/submit`,
    { method: 'POST', signal },
    accessToken,
  );
}

export function getMySubmissions(
  params: ListMySubmissionsParams,
  accessToken: string,
  signal?: AbortSignal,
): Promise<ListMySubmissionsResponse> {
  const query = new URLSearchParams({ page: params.page, pageSize: params.pageSize });
  return apiRequest<ListMySubmissionsResponse>(
    `${API_PATHS.SUBMISSIONS}/me?${query}`, { signal }, accessToken,
  );
}

export function getMyPendingSubmissions(
  accessToken: string,
  signal?: AbortSignal,
): Promise<PendingSubmissionsResponse> {
  return apiRequest<PendingSubmissionsResponse>(
    `${API_PATHS.SUBMISSIONS}/me/pending`, { signal }, accessToken,
  );
}

export function getMySurveyStats(
  accessToken: string,
  signal?: AbortSignal,
): Promise<SurveyorStatsResponse> {
  return apiRequest<SurveyorStatsResponse>(
    `${API_PATHS.SUBMISSIONS}/me/stats`, { signal }, accessToken,
  );
}

export function getSurveySubmissionStatus(
  submissionId: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<SubmissionStatusResponse> {
  return apiRequest<SubmissionStatusResponse>(
    `${API_PATHS.SUBMISSIONS}/status/${encodeURIComponent(submissionId)}`,
    { signal },
    accessToken,
  );
}

export function getSurveyUploadSession(
  sessionId: string,
  accessToken: string,
  signal?: AbortSignal,
): Promise<UploadSessionResponse> {
  return apiRequest<UploadSessionResponse>(
    `${API_PATHS.SUBMISSIONS}/uploads/${encodeURIComponent(sessionId)}`, { signal }, accessToken,
  );
}
