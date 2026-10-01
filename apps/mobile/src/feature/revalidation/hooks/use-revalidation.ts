import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  fetchFirstRevalidationSign,
  getRevalidationEvidenceQueue,
  getRevalidationTasksInBounds,
  getTaskEvidences,
  voteOnRevalidationEvidence,
} from '@/api/revalidation/revalidation';
import type { MapCoordinate } from '@/types/navigationType';
import type {
  EvidenceVoteDto,
  FindTasksInBoundsParams,
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
