import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completeSurveyUpload,
  createMockSubmissionStatus,
  createSurveySubmission,
  updateSurveySubmission,
  submitSurveySubmission,
  getMyPendingSubmissions,
  getMySubmissions,
  getMySurveyStats,
  getSurveySubmissionStatus,
  getSurveyUploadSession,
  initializeSurveyUpload,
  isUuid,
  uploadSurveyChunk,
} from '@/api/survey-submission/survey-submission';
import { useSession } from '@/context/session-provider';
import {
  SIGN_IN_TO_CREATE_SURVEY_MESSAGE,
  SIGN_IN_TO_SUBMIT_SURVEY_MESSAGE,
  SIGN_IN_TO_UPDATE_SURVEY_MESSAGE,
  SIGN_IN_TO_UPLOAD_SURVEY_MESSAGE,
} from '@/constants/message';
import type {
  InitializeUploadDto,
  CreateSubmissionDto,
  UpdateSubmissionDto,
  ListMySubmissionsParams,
  SubmissionStatusResponse,
  UploadChunkRequest,
} from '@/types/surveySubmissionType';

export const surveySubmissionKeys = {
  all: (accountId: string | undefined) => ['survey-submissions', accountId] as const,
  list: (accountId: string | undefined, params: ListMySubmissionsParams) =>
    [...surveySubmissionKeys.all(accountId), 'list', params] as const,
  pending: (accountId: string | undefined) =>
    [...surveySubmissionKeys.all(accountId), 'pending'] as const,
  stats: (accountId: string | undefined) =>
    [...surveySubmissionKeys.all(accountId), 'stats'] as const,
  status: (accountId: string | undefined, submissionId: string | undefined) =>
    [...surveySubmissionKeys.all(accountId), 'status', submissionId] as const,
  session: (accountId: string | undefined, sessionId: string | undefined) =>
    [...surveySubmissionKeys.all(accountId), 'session', sessionId] as const,
};


export type InitializeSurveyUploadVariables = {
  submissionId: string;
  request: InitializeUploadDto;
  signal?: AbortSignal;
};

export type UploadSurveyChunkVariables = {
  sessionId: string;
  request: UploadChunkRequest;
  signal?: AbortSignal;
};

export type CompleteSurveyUploadVariables = {
  sessionId: string;
  signal?: AbortSignal;
};

export type CreateSurveySubmissionVariables = { request: CreateSubmissionDto; signal?: AbortSignal };
export type UpdateSurveySubmissionVariables = {
  submissionId: string;
  request: UpdateSubmissionDto;
  signal?: AbortSignal;
};
export type SubmitSurveySubmissionVariables = { submissionId: string; signal?: AbortSignal };

export function useCreateSurveySubmission() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ request, signal }: CreateSurveySubmissionVariables) => {
      if (!session) throw new Error(SIGN_IN_TO_CREATE_SURVEY_MESSAGE);
      return createSurveySubmission(request, session.accessToken, signal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: surveySubmissionKeys.all(session?.account.id) }),
  });
}

export function useUpdateSurveySubmission() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, request, signal }: UpdateSurveySubmissionVariables) => {
      if (!session) throw new Error(SIGN_IN_TO_UPDATE_SURVEY_MESSAGE);
      return updateSurveySubmission(submissionId, request, session.accessToken, signal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: surveySubmissionKeys.all(session?.account.id) }),
  });
}

export function useSubmitSurveySubmission() {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ submissionId, signal }: SubmitSurveySubmissionVariables) => {
      if (!session) throw new Error(SIGN_IN_TO_SUBMIT_SURVEY_MESSAGE);
      return submitSurveySubmission(submissionId, session.accessToken, signal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: surveySubmissionKeys.all(session?.account.id) }),
  });
}

export type FalseNegativeBoundingBox = {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  signCode?: string;
  signName?: string;
  category?: string;
};

export type ResubmitFalseNegativeVariables = {
  submissionId: string;
  boxes: FalseNegativeBoundingBox[];
  imageDimensions: { width: number; height: number };
  note?: string;
  signal?: AbortSignal;
};

export function useResubmitFalseNegativeMutation() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      boxes,
      imageDimensions,
      note,
      signal,
    }: ResubmitFalseNegativeVariables) => {
      if (!session) throw new Error(SIGN_IN_TO_UPDATE_SURVEY_MESSAGE);

      const normalizedBoxes = boxes.map((box, index) => {
        const xNorm =
          imageDimensions.width > 0
            ? Number((box.x / imageDimensions.width).toFixed(4))
            : 0;
        const yNorm =
          imageDimensions.height > 0
            ? Number((box.y / imageDimensions.height).toFixed(4))
            : 0;
        const wNorm =
          imageDimensions.width > 0
            ? Number((box.width / imageDimensions.width).toFixed(4))
            : 0;
        const hNorm =
          imageDimensions.height > 0
            ? Number((box.height / imageDimensions.height).toFixed(4))
            : 0;

        return {
          boxIndex: index + 1,
          signCode: box.signCode || 'UNKNOWN',
          signName: box.signName || 'Biển báo giao thông',
          category: box.category,
          pixelCoordinates: {
            x: Math.round(box.x),
            y: Math.round(box.y),
            width: Math.round(box.width),
            height: Math.round(box.height),
          },
          normalizedCoordinates: {
            x: xNorm,
            y: yNorm,
            width: wNorm,
            height: hNorm,
          },
        };
      });

      const annotationPayload = {
        correctionType: 'FALSE_NEGATIVE_ANNOTATION',
        totalBoxes: boxes.length,
        annotatedBoxes: normalizedBoxes,
        userNote: note,
        annotatedAt: new Date().toISOString(),
      };

      const signNamesSummary = boxes
        .map((b) => b.signCode || b.signName)
        .filter(Boolean)
        .join(', ');
      const updateNote = `[Khoanh vùng bổ sung ${boxes.length} biển báo: ${signNamesSummary || 'Chưa phân loại'}] ${JSON.stringify(annotationPayload)}`;

      if (!isUuid(submissionId)) {
        return {
          submissionId,
          status: 'SUBMITTED' as const,
          message: 'Đã gửi lại khảo sát thành công (Mock)',
        };
      }

      // 1. Update submission note with bounding box metadata
      await updateSurveySubmission(
        submissionId,
        { note: updateNote },
        session.accessToken,
        signal,
      );

      // 2. Trigger resubmission pipeline
      return await submitSurveySubmission(submissionId, session.accessToken, signal);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: surveySubmissionKeys.all(session?.account.id),
      }),
  });
}

export function useInitializeSurveyUpload() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, request, signal }: InitializeSurveyUploadVariables) => {
      if (!session) throw new Error(SIGN_IN_TO_UPLOAD_SURVEY_MESSAGE);
      return initializeSurveyUpload(submissionId, request, session.accessToken, signal);
    },
    onSuccess: (result) => queryClient.invalidateQueries({
      queryKey: surveySubmissionKeys.session(session?.account.id, result.sessionId),
    }),
  });
}

export function useUploadSurveyChunk() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, request, signal }: UploadSurveyChunkVariables) => {
      if (!session) throw new Error(SIGN_IN_TO_UPLOAD_SURVEY_MESSAGE);
      return uploadSurveyChunk(sessionId, request, session.accessToken, signal);
    },
    onSuccess: (result) => queryClient.invalidateQueries({
      queryKey: surveySubmissionKeys.session(session?.account.id, result.sessionId),
    }),
  });
}

export function useCompleteSurveyUpload() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ sessionId, signal }: CompleteSurveyUploadVariables) => {
      if (!session) throw new Error(SIGN_IN_TO_UPLOAD_SURVEY_MESSAGE);
      return completeSurveyUpload(sessionId, session.accessToken, signal);
    },
    // Completion attaches media to the draft; submitting it is a separate action.
    onSuccess: () => queryClient.invalidateQueries({
      queryKey: surveySubmissionKeys.all(session?.account.id),
    }),
  });
}

export function useGetMySubmissions(
  params: ListMySubmissionsParams = { page: '1', pageSize: '20' },
  enabled = true,
) {
  const { session } = useSession();
  return useQuery({
    queryKey: surveySubmissionKeys.list(session?.account.id, params),
    queryFn: session
      ? ({ signal }) => getMySubmissions(params, session.accessToken, signal)
      : skipToken,
    enabled,
  });
}

export function useGetMyPendingSubmissions(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: surveySubmissionKeys.pending(session?.account.id),
    queryFn: session
      ? ({ signal }) => getMyPendingSubmissions(session.accessToken, signal)
      : skipToken,
    enabled,
  });
}

export function useGetMySurveyStats(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: surveySubmissionKeys.stats(session?.account.id),
    queryFn: session
      ? ({ signal }) => getMySurveyStats(session.accessToken, signal)
      : skipToken,
    enabled,
  });
}

export function useGetSurveySubmissionStatus(submissionId: string | undefined, enabled = true) {
  const { session } = useSession();
  const isValid = Boolean(submissionId && isUuid(submissionId));
  return useQuery<SubmissionStatusResponse>({
    queryKey: surveySubmissionKeys.status(session?.account.id, submissionId),
    queryFn: session && submissionId
      ? ({ signal }) => {
          if (!isValid) {
            return Promise.resolve(createMockSubmissionStatus(submissionId));
          }
          return getSurveySubmissionStatus(submissionId, session.accessToken, signal);
        }
      : skipToken,
    enabled: Boolean(enabled && submissionId),
  });
}

export function useGetSurveyUploadSession(sessionId: string | undefined, enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: surveySubmissionKeys.session(session?.account.id, sessionId),
    queryFn: session && sessionId
      ? ({ signal }) => getSurveyUploadSession(sessionId, session.accessToken, signal)
      : skipToken,
    enabled,
  });
}
