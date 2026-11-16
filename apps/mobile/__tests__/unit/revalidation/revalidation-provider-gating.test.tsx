import React from 'react';
import { render, act, renderHook } from '@testing-library/react-native';
import { View, Text } from 'react-native';

// ---------------------------------------------------------------------------
// 1. Navigation Mock
// ---------------------------------------------------------------------------
let mockSegments: string[] = ['(authenticated)', '(tabs)', 'work'];

jest.mock('expo-router', () => ({
  useSegments: () => mockSegments,
}));

// ---------------------------------------------------------------------------
// 2. React Query & Wallet Mocks
// ---------------------------------------------------------------------------
const mockInvalidateQueries = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: mockInvalidateQueries,
  }),
}));

const mockInvalidateWalletAndStats = jest.fn();
jest.mock('@/feature/credits/hooks/use-wallet', () => ({
  useInvalidateWalletAndStats: () => mockInvalidateWalletAndStats,
}));

// ---------------------------------------------------------------------------
// 3. Session Mock
// ---------------------------------------------------------------------------
let mockSessionData: any = {
  accessToken: 'valid-token',
  account: {
    id: 'user-1',
    roles: ['driver'],
  },
};

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: mockSessionData,
  }),
}));

// ---------------------------------------------------------------------------
// 4. Revalidation Query Hook Mock
// ---------------------------------------------------------------------------
const mockVoteMutateAsync = jest.fn();
let mockQueueData: any = null;
let mockIsLoading = false;
const mockRefetch = jest.fn();

jest.mock('@/feature/revalidation/hooks/use-revalidation', () => ({
  useGetRevalidationEvidenceQueue: jest.fn(() => ({
    data: mockQueueData,
    isLoading: mockIsLoading,
    refetch: mockRefetch,
  })),
  useVoteOnRevalidationEvidence: jest.fn(() => ({
    mutateAsync: mockVoteMutateAsync,
  })),
}));

import { useGetRevalidationEvidenceQueue } from '@/feature/revalidation/hooks/use-revalidation';
import {
  RevalidationWorkflowProvider,
  useRevalidationWorkflow,
} from '@/feature/revalidation/context/revalidation-workflow-provider';
import type { RevalidationQueueEvidenceItem } from '@/types/revalidationType';

describe('RevalidationWorkflowProvider & Gating', () => {
  const sampleQueueItems: RevalidationQueueEvidenceItem[] = [
    {
      evidenceId: 'ev-1',
      taskId: 'task-1',
      signId: 'sign-1',
      mediaUrl: 'https://example.com/ev1.jpg',
      latitude: 10.7769,
      longitude: 106.7009,
      systemPrediction: 'STILL_ACTIVE',
      signCode: 'P.130',
      signName: 'Cấm dừng cấm đỗ',
    } as any,
    {
      evidenceId: 'ev-2',
      taskId: 'task-2',
      signId: 'sign-2',
      mediaUrl: 'https://example.com/ev2.jpg',
      latitude: 10.778,
      longitude: 106.702,
      systemPrediction: 'REMOVED',
      signCode: 'W.201',
      signName: 'Nguy hiểm',
    } as any,
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueueData = null;
    mockIsLoading = false;
    mockSegments = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];
    mockSessionData = {
      accessToken: 'valid-token',
      account: { id: 'rev-1', roles: ['reviewer'] },
    };
    (useGetRevalidationEvidenceQueue as jest.Mock).mockImplementation(() => ({
      data: mockQueueData,
      isLoading: mockIsLoading,
      refetch: mockRefetch,
    }));
  });

  describe('Query Gating & 403 Prevention', () => {
    it('disables revalidation evidence queue query when browsing work dashboard (not on reval review screen)', async () => {
      mockSegments = ['(authenticated)', '(tabs)', 'work'];
      mockSessionData = {
        accessToken: 'valid-token',
        account: { id: 'rev-1', roles: ['reviewer'] },
      };

      await render(
        <RevalidationWorkflowProvider>
          <View>
            <Text>Work Screen Child</Text>
          </View>
        </RevalidationWorkflowProvider>,
      );

      expect(useGetRevalidationEvidenceQueue).toHaveBeenCalledWith(
        { pageSize: 50 },
        false, // isQueryEnabled must be FALSE on work dashboard
      );
    });

    it('disables revalidation evidence queue query for non-reviewer accounts (preventing 403 Forbidden)', async () => {
      mockSegments = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];
      mockSessionData = {
        accessToken: 'driver-token',
        account: { id: 'driver-1', roles: ['driver'] }, // NOT a reviewer
      };

      await render(
        <RevalidationWorkflowProvider>
          <View>
            <Text>Review Screen Child</Text>
          </View>
        </RevalidationWorkflowProvider>,
      );

      expect(useGetRevalidationEvidenceQueue).toHaveBeenCalledWith(
        { pageSize: 50 },
        false, // isQueryEnabled must be FALSE for driver/surveyor accounts
      );
    });

    it('enables revalidation evidence queue query when user is reviewer AND on revalidation review screen', async () => {
      mockSegments = ['(authenticated)', '(tabs)', 'work', 'revalidation-review'];
      mockSessionData = {
        accessToken: 'reviewer-token',
        account: { id: 'rev-1', roles: ['reviewer'] },
      };

      await render(
        <RevalidationWorkflowProvider>
          <View>
            <Text>Review Screen Child</Text>
          </View>
        </RevalidationWorkflowProvider>,
      );

      expect(useGetRevalidationEvidenceQueue).toHaveBeenCalledWith(
        { pageSize: 50 },
        true, // isQueryEnabled must be TRUE
      );
    });
  });

  describe('Workflow Execution & Voting State Machine', () => {
    it('returns fallback context when useRevalidationWorkflow is used outside provider', async () => {
      const { result } = await renderHook(() => useRevalidationWorkflow());
      expect(result.current.queueItems).toEqual([]);
      expect(result.current.counts.STILL_ACTIVE).toBe(0);
      expect(result.current.finishReviews()).toBe(0);
      expect(await result.current.handleVote('STILL_ACTIVE')).toBe(false);
      expect(result.current.handleSkip()).toBe(false);
      expect(result.current.keepCurrentEvidenceAndNext?.()).toBe(false);
      result.current.beginEvidenceCheck();
      result.current.cancelEvidenceCheck?.();
      result.current.resetWorkflow();
    });

    it('initializes queue and votes on evidence, updating history and counts', async () => {
      mockQueueData = {
        items: sampleQueueItems,
        total: 2,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RevalidationWorkflowProvider>{children}</RevalidationWorkflowProvider>
      );

      const { result } = await renderHook(() => useRevalidationWorkflow(), { wrapper });

      expect(result.current.queueItems.length).toBe(2);
      expect(result.current.currentItem?.evidenceId).toBe('ev-1');
      expect(result.current.nextItem?.evidenceId).toBe('ev-2');

      // 1. Vote on item 1: STILL_ACTIVE
      let completesQueue = false;
      await act(async () => {
        completesQueue = await result.current.handleVote('STILL_ACTIVE', 'Tình trạng tốt');
      });

      expect(completesQueue).toBe(false);
      expect(mockVoteMutateAsync).toHaveBeenCalledWith({
        evidenceId: 'ev-1',
        dto: {
          decision: 'STILL_ACTIVE',
          note: 'Tình trạng tốt',
          suggestedSignTypeId: undefined,
        },
      });

      expect(result.current.reviewHistory.length).toBe(1);
      expect(result.current.counts.STILL_ACTIVE).toBe(1);
      expect(result.current.currentItem?.evidenceId).toBe('ev-2');

      // 2. Vote on item 2: CHANGED with suggestedSignTypeId
      await act(async () => {
        completesQueue = await result.current.handleVote('CHANGED', 'Đã thay bằng biển mới', 99, 'DECLINE');
      });

      expect(completesQueue).toBe(true);
      expect(mockVoteMutateAsync).toHaveBeenCalledWith({
        evidenceId: 'ev-2',
        dto: {
          decision: 'CHANGED',
          note: 'Đã thay bằng biển mới',
          suggestedSignTypeId: 99,
        },
      });

      expect(result.current.counts.CHANGED).toBe(1);
      expect(result.current.queueItems.length).toBe(0);
      expect(result.current.progressPercent).toBe(100);
    });

    it('handles skip action and marks as UNCLEAR', async () => {
      mockQueueData = {
        items: [sampleQueueItems[0]],
        total: 1,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RevalidationWorkflowProvider>{children}</RevalidationWorkflowProvider>
      );

      const { result } = await renderHook(() => useRevalidationWorkflow(), { wrapper });

      await act(async () => {
        const completes = result.current.handleSkip();
        expect(completes).toBe(true);
      });

      expect(result.current.counts.UNCLEAR).toBe(1);
      expect(result.current.reviewHistory[0].userVerdict).toBe('SKIP');
    });

    it('supports beginEvidenceCheck, keepCurrentEvidenceAndNext, and cancelEvidenceCheck', async () => {
      mockQueueData = {
        items: sampleQueueItems,
        total: 2,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RevalidationWorkflowProvider>{children}</RevalidationWorkflowProvider>
      );

      const { result } = await renderHook(() => useRevalidationWorkflow(), { wrapper });

      // Vote on both items
      await act(async () => {
        await result.current.handleVote('STILL_ACTIVE');
        await result.current.handleVote('REMOVED');
      });

      expect(result.current.reviewHistory.length).toBe(2);

      // Begin evidence recheck on item 0
      await act(async () => {
        result.current.beginEvidenceCheck(0);
      });

      expect(result.current.isCheckingEvidence).toBe(true);
      expect(result.current.queueItems.length).toBe(2);

      // Keep first evidence
      await act(async () => {
        result.current.keepCurrentEvidenceAndNext?.();
      });

      expect(result.current.queueItems.length).toBe(1);

      // Cancel evidence check to restore remaining history
      await act(async () => {
        result.current.cancelEvidenceCheck?.();
      });

      expect(result.current.isCheckingEvidence).toBe(false);
      expect(result.current.reviewHistory.length).toBe(2);
    });

    it('finishReviews invalidates queries and resets state', async () => {
      mockQueueData = {
        items: [sampleQueueItems[0]],
        total: 1,
      };

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RevalidationWorkflowProvider>{children}</RevalidationWorkflowProvider>
      );

      const { result } = await renderHook(() => useRevalidationWorkflow(), { wrapper });

      await act(async () => {
        await result.current.handleVote('STILL_ACTIVE');
      });

      let count = 0;
      await act(async () => {
        count = result.current.finishReviews();
      });

      expect(count).toBe(1);
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['revalidation-evidence-queue'] });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['revalidation-tasks'] });
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ['reviewer-stats'] });
      expect(mockInvalidateWalletAndStats).toHaveBeenCalled();
      expect(result.current.reviewHistory.length).toBe(0);
    });

    it('resetWorkflow and refetchQueue trigger refetch and updates', async () => {
      mockRefetch.mockResolvedValueOnce({
        data: { items: [sampleQueueItems[1]], total: 1 },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <RevalidationWorkflowProvider>{children}</RevalidationWorkflowProvider>
      );

      const { result } = await renderHook(() => useRevalidationWorkflow(), { wrapper });

      await act(async () => {
        await result.current.refetchQueue();
      });

      expect(mockRefetch).toHaveBeenCalled();
      expect(result.current.queueItems.length).toBe(1);

      await act(async () => {
        result.current.resetWorkflow();
      });

      expect(mockRefetch).toHaveBeenCalledTimes(2);
    });
  });
});
