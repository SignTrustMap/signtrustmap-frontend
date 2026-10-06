import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchFirstRevalidationSign,
  finalizeRevalidationTask,
  getAllRevalidationTasks,
  getEvidenceDecisions,
  getRevalidationEvidenceQueue,
  getRevalidationTask,
  getRevalidationTasks,
  getRevalidationTasksInBounds,
  getTaskEvidences,
  submitRevalidationEvidence,
  voteOnRevalidationEvidence,
} from '@/api/revalidation/revalidation';
import type { MapCoordinate } from '@/types/navigationType';
import type {
  EvidenceVoteDto,
  FindTasksInBoundsParams,
  GetRevalidationTasksParams,
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

export function useGetFirstRevalidationSign(
  userCoordinate?: MapCoordinate,
  enabled = true,
) {
  return useQuery({
    queryKey: ['first-revalidation-sign', userCoordinate],
    queryFn: enabled
      ? ({ signal }) => fetchFirstRevalidationSign(userCoordinate, signal)
      : skipToken,
    enabled,
    staleTime: 60_000,
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

export function useSubmitRevalidationEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskIdOrSignId,
      data,
      mediaFile,
    }: {
      taskIdOrSignId: string;
      data: SubmitRevalidationEvidenceDto;
      mediaFile?: { uri: string; fileName?: string; mimeType?: string };
    }) => submitRevalidationEvidence(taskIdOrSignId, data, mediaFile),
    onSuccess: (_, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['task-evidences', variables.taskIdOrSignId] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks-in-bounds'] });
      void queryClient.invalidateQueries({ queryKey: ['all-revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    },
  });
}

export function useVoteOnRevalidationEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ evidenceId, dto }: { evidenceId: string; dto: EvidenceVoteDto }) =>
      voteOnRevalidationEvidence(evidenceId, dto),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });
      void queryClient.invalidateQueries({ queryKey: ['reviewer-stats'] });
      void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
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
    },
  });
}

