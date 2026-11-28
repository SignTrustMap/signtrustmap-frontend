import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockUseSegments = jest.fn(() => ['work', 'revalidation-review']);
jest.mock('expo-router', () => ({
  useSegments: () => mockUseSegments(),
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: { accessToken: 'tok-reval', account: { id: 'u-1', roles: ['reviewer'] } } }),
}));

jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useInvalidateWalletAndStats: () => jest.fn(),
}));

const mockRefetchQueue = jest.fn();
const mockVoteMutateAsync = jest.fn();
let mockQueueData: any = { items: [], total: 0 };
jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetRevalidationEvidenceQueue: () => ({
    data: mockQueueData,
    isLoading: false,
    refetch: mockRefetchQueue,
  }),
  useVoteOnRevalidationEvidence: () => ({ mutateAsync: mockVoteMutateAsync }),
}));

import {
  RevalidationWorkflowProvider,
  useRevalidationWorkflow,
} from '@/feature/revalidation/context/revalidation-workflow-provider';

describe('RevalidationWorkflowProvider Branch Coverage', () => {
  const item1: any = {
    evidenceId: 'ev-1',
    taskId: 't-1',
    evidence: { mediaUrl: 'ev1.jpg' },
    verifiedSign: { signCode: 'P.102', nameVi: 'Cấm đi ngược' },
  };
  const item2: any = {
    evidenceId: 'ev-2',
    taskId: 't-2',
    evidence: { mediaUrl: 'ev2.jpg' },
    verifiedSign: { signCode: 'W.201', nameVi: 'Chỗ ngoặt' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSegments.mockReturnValue(['work', 'revalidation-review']);
    mockQueueData = { items: [item1, item2], total: 2 };
    mockVoteMutateAsync.mockResolvedValue({ consensus: { evaluated: false } });
    mockRefetchQueue.mockResolvedValue({ data: { items: [item1, item2], total: 2 } });
  });

  const makeWrapper = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>
        <RevalidationWorkflowProvider>{children}</RevalidationWorkflowProvider>
      </QueryClientProvider>
    );
  };

  it('returns fallback value outside provider cleanly', async () => {
    const { result } = await renderHook(() => useRevalidationWorkflow());
    expect(await result.current.handleVote('STILL_ACTIVE')).toBe(false);
    expect(result.current.handleSkip()).toBe(false);
    expect(result.current.finishReviews()).toBe(0);
    expect(result.current.keepCurrentEvidenceAndNext?.()).toBe(false);
    await result.current.refetchQueue?.();
    result.current.resetWorkflow();
    result.current.cancelEvidenceCheck?.();
    result.current.beginEvidenceCheck();
    result.current.jumpToEvidenceById?.('x');
  });

  it('covers queue refetch, vote, skip, jump, recheck, keep, cancel, finish, and reset', async () => {
    const { result } = await renderHook(() => useRevalidationWorkflow(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(result.current.queueItems).toHaveLength(2));
    await act(async () => {
      await result.current.refetchQueue();
    });
    expect(mockRefetchQueue).toHaveBeenCalled();

    // Jump to item 2 and back
    await act(async () => {
      result.current.jumpToEvidenceById?.('');
      result.current.jumpToEvidenceById?.('ev-2'); // brings ev-2 to front
    });
    expect(result.current.currentItem?.evidenceId).toBe('ev-2');

    await act(async () => {
      const done = await result.current.handleVote('CHANGED', 'Changed to P.103', 42, 'DECLINE');
      expect(done).toBe(false);
    });
    expect(mockVoteMutateAsync).toHaveBeenCalled();

    // Skip remaining item -> completes queue
    await act(async () => {
      const done = result.current.handleSkip();
      expect(done).toBe(true);
    });
    expect(result.current.reviewHistory).toHaveLength(2);

    // Begin check from index 0, keep first, cancel rest, finish
    await act(async () => {
      result.current.beginEvidenceCheck(0);
    });
    expect(result.current.isCheckingEvidence).toBe(true);

    await act(async () => {
      result.current.keepCurrentEvidenceAndNext?.();
    });
    await act(async () => {
      result.current.cancelEvidenceCheck?.();
    });
    await act(async () => {
      const finished = result.current.finishReviews();
      expect(finished).toBe(2);
    });

    // Reset & vote error propagation
    await act(async () => {
      await result.current.refetchQueue?.();
    });
    mockVoteMutateAsync.mockRejectedValueOnce(new Error('Vote HTTP 500'));
    await act(async () => {
      await expect(result.current.handleVote('STILL_ACTIVE')).rejects.toThrow('Vote HTTP 500');
    });

    await act(async () => {
      result.current.resetWorkflow();
    });
  });
});
