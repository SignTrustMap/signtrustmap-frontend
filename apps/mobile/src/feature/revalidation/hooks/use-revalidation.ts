import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  checkInRevalidationTask,
  finalizeRevalidationTask,
  getAllRevalidationTasks,
  getCheckInEligibility,
  getEvidenceDecisions,
  getRevalidationEvidenceQueue,
  getRevalidationTask,
  getRevalidationTasks,
  getRevalidationTasksInBounds,
  getSignEvidences,
  getSignHistory,
  getTaskEvidences,
  requestEvidenceRecapture,
  submitRevalidationEvidence,
  voteOnRevalidationEvidence,
} from '@/api/revalidation/revalidation';
import type {
  CheckInEligibilityDto,
  EvidenceVoteDto,
  FindTasksInBoundsParams,
  GetRevalidationTasksParams,
  RequestEvidenceRecaptureDto,
  SubmitRevalidationEvidenceDto,
} from '@/types/revalidationType';

export function isRealWorldTaskBounds(bounds: FindTasksInBoundsParams | undefined): boolean {
  if (!bounds) return false;
  const { minLat, maxLat, minLon, maxLon } = bounds;
  if (minLat <= -80 && maxLat >= 80 && minLon <= -80 && maxLon >= 80) return false;
  return (
    Number.isFinite(minLat) &&
    Number.isFinite(maxLat) &&
    Number.isFinite(minLon) &&
    Number.isFinite(maxLon)
  );
}

export function useGetAllRevalidationTasks(
  paramsOrEnabled?: { status?: string; priority?: string; pageSize?: number } | boolean,
  enabledParam = true,
) {
  const params = typeof paramsOrEnabled === 'object' ? paramsOrEnabled : undefined;
  const enabled = typeof paramsOrEnabled === 'boolean' ? paramsOrEnabled : enabledParam;

  return useQuery({
    queryKey: ['all-revalidation-tasks', params],
    queryFn: enabled
      ? ({ signal }) => getAllRevalidationTasks(params, signal)
      : skipToken,
    enabled,
    staleTime: 60_000,
  });
}

export function useGetRevalidationTasks(
  params?: GetRevalidationTasksParams,
  enabled = true,
) {
  return useQuery({
    queryKey: ['revalidation-tasks', params],
    queryFn: enabled
      ? ({ signal }) => getRevalidationTasks(params, signal)
      : skipToken,
    enabled,
    staleTime: 30_000,
  });
}

export function useGetRevalidationTask(taskId?: string, enabled = true) {
  return useQuery({
    queryKey: ['revalidation-task-detail', taskId],
    queryFn: enabled && taskId
      ? ({ signal }) => getRevalidationTask(taskId, signal)
      : skipToken,
    enabled: Boolean(enabled && taskId),
    staleTime: 30_000,
  });
}

export function useGetRevalidationTasksInBounds(
  bounds: FindTasksInBoundsParams | undefined,
  enabled = true,
) {
  const validBounds = isRealWorldTaskBounds(bounds);

  return useQuery({
    queryKey: ['revalidation-tasks-in-bounds', bounds],
    queryFn: enabled && validBounds && bounds
      ? ({ signal }) => getRevalidationTasksInBounds(bounds, signal)
      : skipToken,
    enabled: Boolean(enabled && validBounds && bounds),
    staleTime: 30_000,
  });
}

export function useGetTaskEvidences(taskId?: string, enabled = true) {
  return useQuery({
    queryKey: ['task-evidences', taskId],
    queryFn: enabled && taskId
      ? ({ signal }) => getTaskEvidences(taskId, signal)
      : skipToken,
    enabled: Boolean(enabled && taskId),
    staleTime: 30_000,
  });
}

export function useGetSignEvidences(signId?: string, enabled = true) {
  return useQuery({
    queryKey: ['sign-evidences', signId],
    queryFn: enabled && signId
      ? ({ signal }) => getSignEvidences(signId, signal)
      : skipToken,
    enabled: Boolean(enabled && signId),
    staleTime: 30_000,
  });
}

export function useGetRevalidationEvidenceQueue(
  params?: { page?: number; pageSize?: number },
  enabled = true,
) {
  return useQuery({
    queryKey: ['revalidation-evidence-queue', params],
    queryFn: enabled
      ? ({ signal }) => getRevalidationEvidenceQueue(params, signal)
      : skipToken,
    enabled,
    staleTime: 30_000,
  });
}

export function useGetEvidenceDecisions(evidenceId?: string, enabled = true) {
  return useQuery({
    queryKey: ['evidence-decisions', evidenceId],
    queryFn: enabled && evidenceId
      ? ({ signal }) => getEvidenceDecisions(evidenceId, signal)
      : skipToken,
    enabled: Boolean(enabled && evidenceId),
    staleTime: 30_000,
  });
}

export function useGetSignHistory(signId?: string, enabled = true) {
  return useQuery({
    queryKey: ['sign-history', signId],
    queryFn: enabled && signId
      ? ({ signal }) => getSignHistory(signId, signal)
      : skipToken,
    enabled: Boolean(enabled && signId),
    staleTime: 60_000,
  });
}

export function useCheckInRevalidationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      dto,
      accessToken,
    }: {
      taskId: string;
      dto: CheckInEligibilityDto;
      accessToken?: string;
    }) => checkInRevalidationTask(taskId, dto, undefined, accessToken),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['check-in-eligibility', data.taskId] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-task-detail', data.taskId] });
    },
  });
}

export function useGetCheckInEligibility(
  taskId?: string,
  lat?: number,
  lon?: number,
  accuracyMeters?: number,
  enabled = true,
) {
  const isCoordValid = lat != null && lon != null && !Number.isNaN(lat) && !Number.isNaN(lon);

  return useQuery({
    queryKey: ['check-in-eligibility', taskId, lat, lon, accuracyMeters],
    queryFn: enabled && taskId && isCoordValid
      ? ({ signal }) => getCheckInEligibility(taskId, lat, lon, accuracyMeters, signal)
      : skipToken,
    enabled: Boolean(enabled && taskId && isCoordValid),
    staleTime: 15_000,
  });
}

export function useSubmitRevalidationEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskIdOrSignId,
      data,
      mediaFile,
      accessToken,
    }: {
      taskIdOrSignId: string;
      data: SubmitRevalidationEvidenceDto;
      mediaFile?: { uri: string; fileName?: string; mimeType?: string };
      accessToken?: string;
    }) => submitRevalidationEvidence(taskIdOrSignId, data, mediaFile, accessToken),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['task-evidences', variables.taskIdOrSignId] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-task-detail', variables.taskIdOrSignId] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks-in-bounds'] });
      void queryClient.invalidateQueries({ queryKey: ['all-revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
  });
}

export const useSubmitRevalidation = useSubmitRevalidationEvidence;

export function useVoteOnRevalidationEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ evidenceId, dto }: { evidenceId: string; dto: EvidenceVoteDto }) =>
      voteOnRevalidationEvidence(evidenceId, dto),
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['reviewer-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
      void queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
      if (variables?.dto?.questClaimId) {
        void queryClient.invalidateQueries({ queryKey: ['bounty-board'] });
      }
      if (data?.consensus?.evaluated) {
        void queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
        void queryClient.invalidateQueries({ queryKey: ['all-revalidation-tasks'] });
        void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks'] });
        void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks-in-bounds'] });
        void queryClient.invalidateQueries({ queryKey: ['signs'] });
        void queryClient.invalidateQueries({ queryKey: ['signs-in-bounds'] });
        if (data.consensus.taskId) {
          void queryClient.invalidateQueries({ queryKey: ['revalidation-task-detail', data.consensus.taskId] });
        }
      }
    },
  });
}

export function useRequestEvidenceRecapture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      evidenceId,
      dto,
      accessToken,
    }: {
      evidenceId: string;
      dto: RequestEvidenceRecaptureDto;
      accessToken?: string;
    }) => requestEvidenceRecapture(evidenceId, dto, undefined, accessToken),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-task-detail', data.taskId] });
      void queryClient.invalidateQueries({ queryKey: ['daily-tasks'] });
    },
  });
}

export function useFinalizeRevalidationTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => finalizeRevalidationTask(taskId),
    onSuccess: (_, taskId) => {
      void queryClient.invalidateQueries({ queryKey: ['revalidation-task-detail', taskId] });
      void queryClient.invalidateQueries({ queryKey: ['all-revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks-in-bounds'] });
      void queryClient.invalidateQueries({ queryKey: ['signs'] });
      void queryClient.invalidateQueries({ queryKey: ['signs-in-bounds'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });
}

