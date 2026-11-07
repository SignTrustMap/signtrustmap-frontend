import React from 'react';
import { renderHook, waitFor, act, cleanup } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('@/api/revalidation/revalidation', () => ({
  getAllRevalidationTasks: jest.fn().mockResolvedValue([{ id: 'task-1', title: 'Check sign' }]),
  getRevalidationTasks: jest.fn().mockResolvedValue([{ id: 'task-1' }]),
  getRevalidationTask: jest.fn().mockResolvedValue({ id: 'task-1', status: 'PENDING' }),
  getRevalidationTasksInBounds: jest.fn().mockResolvedValue([{ id: 'task-1' }]),
  fetchFirstRevalidationSign: jest.fn().mockResolvedValue({ id: 'sign-1' }),
  getTaskEvidences: jest.fn().mockResolvedValue([{ id: 'ev-1' }]),
  getSignEvidences: jest.fn().mockResolvedValue([{ id: 'ev-1' }]),
  getRevalidationEvidenceQueue: jest.fn().mockResolvedValue({ items: [{ id: 'ev-1' }], total: 1 }),
  getEvidenceDecisions: jest.fn().mockResolvedValue([{ id: 'dec-1' }]),
  submitRevalidationEvidence: jest.fn().mockResolvedValue({ id: 'sub-ev-1' }),
  voteOnRevalidationEvidence: jest.fn().mockResolvedValue({ success: true }),
  finalizeRevalidationTask: jest.fn().mockResolvedValue({ success: true }),
}));

import {
  isRealWorldTaskBounds,
  useGetAllRevalidationTasks,
  useGetRevalidationTasks,
  useGetRevalidationTask,
  useGetRevalidationTasksInBounds,
  useGetFirstRevalidationSign,
  useGetTaskEvidences,
  useGetSignEvidences,
  useGetRevalidationEvidenceQueue,
  useGetEvidenceDecisions,
  useSubmitRevalidationEvidence,
  useVoteOnRevalidationEvidence,
  useFinalizeRevalidationTask,
} from '@/feature/revalidation/hooks/use-revalidation';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
}

describe('use-revalidation hooks and bounds validation', () => {
  afterEach(async () => {
    cleanup();
    jest.clearAllMocks();
  });

  describe('isRealWorldTaskBounds', () => {
    it('validates geographic bounds boundaries', () => {
      expect(isRealWorldTaskBounds(undefined)).toBe(false);
      expect(isRealWorldTaskBounds({ minLat: -85, maxLat: 85, minLon: -85, maxLon: 85 })).toBe(false);
      expect(isRealWorldTaskBounds({ minLat: 10.7, maxLat: 10.8, minLon: 106.6, maxLon: 106.7 })).toBe(true);
      expect(isRealWorldTaskBounds({ minLat: NaN, maxLat: 10.8, minLon: 106.6, maxLon: 106.7 })).toBe(false);
    });
  });

  describe('queries', () => {
    it('fetches all tasks and tasks in bounds', async () => {
      const wrapper = createWrapper();

      const { result: allTasks } = await renderHook(() => useGetAllRevalidationTasks(true), { wrapper });
      await waitFor(() => expect(allTasks.current.isSuccess).toBe(true));
      expect(allTasks.current.data).toHaveLength(1);

      const { result: tasks } = await renderHook(() => useGetRevalidationTasks(), { wrapper });
      await waitFor(() => expect(tasks.current.isSuccess).toBe(true));

      const { result: singleTask } = await renderHook(() => useGetRevalidationTask('task-1'), { wrapper });
      await waitFor(() => expect(singleTask.current.isSuccess).toBe(true));

      const { result: inBounds } = await renderHook(
        () => useGetRevalidationTasksInBounds({ minLat: 10.7, maxLat: 10.8, minLon: 106.6, maxLon: 106.7 }),
        { wrapper }
      );
      await waitFor(() => expect(inBounds.current.isSuccess).toBe(true));

      const { result: firstSign } = await renderHook(
        () => useGetFirstRevalidationSign([106.7, 10.77]),
        { wrapper }
      );
      await waitFor(() => expect(firstSign.current.isSuccess).toBe(true));

      const { result: taskEv } = await renderHook(() => useGetTaskEvidences('task-1'), { wrapper });
      await waitFor(() => expect(taskEv.current.isSuccess).toBe(true));

      const { result: signEv } = await renderHook(() => useGetSignEvidences('sign-1'), { wrapper });
      await waitFor(() => expect(signEv.current.isSuccess).toBe(true));

      const { result: queue } = await renderHook(() => useGetRevalidationEvidenceQueue(), { wrapper });
      await waitFor(() => expect(queue.current.isSuccess).toBe(true));

      const { result: decisions } = await renderHook(() => useGetEvidenceDecisions('ev-1'), { wrapper });
      await waitFor(() => expect(decisions.current.isSuccess).toBe(true));
    });
  });

  describe('mutations', () => {
    it('submits revalidation evidence', async () => {
      const wrapper = createWrapper();
      const { result } = await renderHook(() => useSubmitRevalidationEvidence(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          taskIdOrSignId: 'task-1',
          data: { status: 'VERIFIED' } as any,
          accessToken: 'token-123',
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('votes on revalidation evidence', async () => {
      const wrapper = createWrapper();
      const { result } = await renderHook(() => useVoteOnRevalidationEvidence(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync({
          evidenceId: 'ev-1',
          dto: { vote: 'APPROVE' } as any,
        });
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });

    it('finalizes revalidation task', async () => {
      const wrapper = createWrapper();
      const { result } = await renderHook(() => useFinalizeRevalidationTask(), { wrapper });

      await act(async () => {
        await result.current.mutateAsync('task-1');
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });
});
