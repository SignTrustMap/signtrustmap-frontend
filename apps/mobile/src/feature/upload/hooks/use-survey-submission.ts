import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  completeSurveyUpload,
  getLatestSurveyDraft,
  createSurveySubmission,
  updateSurveySubmission,
  submitSurveySubmission,
  getMyPendingSubmissions,
  getMySubmissions,
  getMySurveyStats,
  getSurveySubmissionStatus,
  getSurveyUploadSession,
  initializeSurveyUpload,
  uploadSurveyChunk,
} from '@/api/survey-submission/survey-submission';
import { useSession } from '@/context/session-provider';
import type {
  InitializeUploadDto,
  CreateSubmissionDto,
  UpdateSubmissionDto,
  ListMySubmissionsParams,
  UploadChunkRequest,
} from '@/types/survey-submission/surveySubmissionType';

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

export function useGetLatestSurveyDraft(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: [...surveySubmissionKeys.all(session?.account.id), 'latest-draft'],
    queryFn: session ? ({ signal }) => getLatestSurveyDraft(session.accessToken, signal) : skipToken,
    enabled,
    refetchOnMount: 'always',
  });
}

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
      if (!session) throw new Error('Sign in to create a survey.');
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
      if (!session) throw new Error('Sign in to update a survey.');
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
      if (!session) throw new Error('Sign in to submit a survey.');
      return submitSurveySubmission(submissionId, session.accessToken, signal);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: surveySubmissionKeys.all(session?.account.id) }),
  });
}

export function useInitializeSurveyUpload() {
  const { session } = useSession();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, request, signal }: InitializeSurveyUploadVariables) => {
      if (!session) throw new Error('Sign in to upload a survey.');
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
      if (!session) throw new Error('Sign in to upload a survey.');
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
      if (!session) throw new Error('Sign in to upload a survey.');
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
  return useQuery({
    queryKey: surveySubmissionKeys.status(session?.account.id, submissionId),
    queryFn: session && submissionId
      ? ({ signal }) => getSurveySubmissionStatus(submissionId, session.accessToken, signal)
      : skipToken,
    enabled,
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
