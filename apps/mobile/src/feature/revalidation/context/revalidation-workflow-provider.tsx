import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSegments } from 'expo-router';

import { useSession } from '@/context/session-provider';
import { useInvalidateWalletAndStats } from '@/feature/credits/hooks/use-wallet';
import {
  useGetRevalidationEvidenceQueue,
  useVoteOnRevalidationEvidence,
} from '@/feature/revalidation/hooks/use-revalidation';
import type {
  RevalDecision,
  RevalidationQueueEvidenceItem,
} from '@/types/revalidationType';

export type RevalidationReviewAction = 'STILL_ACTIVE' | 'REMOVED' | 'CHANGED' | 'UNCLEAR' | 'INVALID';

export type CompletedRevalidationReview = {
  action: RevalidationReviewAction;
  item: RevalidationQueueEvidenceItem;
  note?: string;
  suggestedSignTypeId?: number;
  userVerdict?: 'AGREE' | 'DECLINE' | 'SKIP' | 'REPORT';
};

export type RevalidationWorkflowContextValue = {
  beginEvidenceCheck: (targetIndex?: number) => void;
  cancelEvidenceCheck?: () => void;
  counts: Record<RevalidationReviewAction, number>;
  currentItem?: RevalidationQueueEvidenceItem;
  finishReviews: () => number;
  handleVote: (
    action: RevalidationReviewAction,
    note?: string,
    suggestedSignTypeId?: number,
    userVerdict?: 'AGREE' | 'DECLINE' | 'SKIP' | 'REPORT',
  ) => Promise<boolean>;
  handleSkip: () => boolean;
  isCheckingEvidence: boolean;
  isLoading: boolean;
  keepCurrentEvidenceAndNext?: () => boolean;
  nextItem?: RevalidationQueueEvidenceItem;
  progressPercent: number;
  queueItems: RevalidationQueueEvidenceItem[];
  recheckingIndex?: number;
  recheckingPreviousReview?: CompletedRevalidationReview;
  refetchQueue: () => Promise<void>;
  resetWorkflow: () => void;
  reviewHistory: CompletedRevalidationReview[];
  reviewPosition: number;
  totalCount: number;
};

export const RevalidationWorkflowContext = createContext<
  RevalidationWorkflowContextValue | undefined
>(undefined);

export function RevalidationWorkflowProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const invalidateWalletAndStats = useInvalidateWalletAndStats();
  const { session } = useSession();

  const segments = useSegments();
  const rawSegments = (segments ?? []) as string[];
  const isRevalReviewActive =
    rawSegments.includes('revalidation-review') ||
    rawSegments.includes('revalidation-summary') ||
    rawSegments.includes('inspect-revalidate');

  const isReviewer = Boolean(session?.account?.roles?.includes('reviewer'));
  const isQueryEnabled = Boolean(session?.accessToken && isReviewer && isRevalReviewActive);

  const {
    data: queueResponse,
    isLoading,
    refetch,
  } = useGetRevalidationEvidenceQueue({ pageSize: 50 }, isQueryEnabled);

  const voteMutation = useVoteOnRevalidationEvidence();

  const [queueItems, setQueueItems] = useState<RevalidationQueueEvidenceItem[]>([]);
  const [reviewHistory, setReviewHistory] = useState<CompletedRevalidationReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isCheckingEvidence, setIsCheckingEvidence] = useState(false);
  const [recheckingIndex, setRecheckingIndex] = useState<number | undefined>(undefined);
  const [recheckingPreviousReview, setRecheckingPreviousReview] = useState<CompletedRevalidationReview | undefined>(undefined);
  const hasInitializedRef = useRef(false);

  // Sync with incoming queue response initially
  useEffect(() => {
    if (!isQueryEnabled) {
      hasInitializedRef.current = false;
      return;
    }

    if (queueResponse?.items && !hasInitializedRef.current && reviewHistory.length === 0) {
      setQueueItems(queueResponse.items);
      setTotalCount(queueResponse.total || queueResponse.items.length);
      hasInitializedRef.current = true;
    }
  }, [isQueryEnabled, queueResponse, reviewHistory.length]);

  const currentItem = queueItems[0];
  const nextItem = queueItems[1];

  const reviewPosition = Math.min(
    reviewHistory.length + (currentItem ? 1 : 0),
    Math.max(totalCount, 1),
  );
  const progressPercent = Math.min(
    100,
    (reviewPosition / Math.max(totalCount, 1)) * 100,
  );

  const counts = useMemo(() => {
    return reviewHistory.reduce<Record<RevalidationReviewAction, number>>(
      (res, rev) => ({ ...res, [rev.action]: (res[rev.action] || 0) + 1 }),
      { STILL_ACTIVE: 0, REMOVED: 0, CHANGED: 0, UNCLEAR: 0, INVALID: 0 },
    );
  }, [reviewHistory]);

  const handleVote = useCallback(
    async (
      action: RevalidationReviewAction,
      note?: string,
      suggestedSignTypeId?: number,
      userVerdict: 'AGREE' | 'DECLINE' | 'SKIP' | 'REPORT' = 'AGREE',
    ): Promise<boolean> => {
      if (!currentItem) return false;

      const itemToVote = currentItem;
      const completesQueue = queueItems.length <= 1;

      // 1. Advance queue state
      setQueueItems((prev) => prev.slice(1));
      setReviewHistory((prev) => {
        const next = [...prev];
        const newReview: CompletedRevalidationReview = {
          item: itemToVote,
          action,
          note,
          suggestedSignTypeId,
          userVerdict,
        };
        next.push(newReview);
        return next;
      });

      if (completesQueue) {
        setIsCheckingEvidence(false);
        setRecheckingIndex(undefined);
        setRecheckingPreviousReview(undefined);
      } else {
        const nextItem = queueItems[1];
        setRecheckingPreviousReview(
          (nextItem as (RevalidationQueueEvidenceItem & { previousReview?: CompletedRevalidationReview }))
            ?.previousReview,
        );
      }

      // 2. Dispatch vote API
      const decisionMap: Record<RevalidationReviewAction, RevalDecision> = {
        STILL_ACTIVE: 'STILL_ACTIVE',
        REMOVED: 'REMOVED',
        CHANGED: 'CHANGED',
        UNCLEAR: 'UNCLEAR',
        INVALID: 'INVALID',
      };

      try {
        await voteMutation.mutateAsync({
          evidenceId: itemToVote.evidenceId,
          dto: {
            decision: decisionMap[action] || action,
            note: note?.trim() || undefined,
            suggestedSignTypeId:
              action === 'CHANGED' && suggestedSignTypeId ? suggestedSignTypeId : undefined,
          },
        });
      } catch (err) {
        console.warn('[RevalidationWorkflow] vote mutation error:', err);
      }

      return completesQueue;
    },
    [currentItem, queueItems, voteMutation],
  );

  const handleSkip = useCallback((): boolean => {
    if (!currentItem) return false;
    const itemToSkip = currentItem;
    const completesQueue = queueItems.length <= 1;

    setQueueItems((prev) => prev.slice(1));
    setReviewHistory((prev) => {
      const next = [...prev];
      const newReview: CompletedRevalidationReview = {
        item: itemToSkip,
        action: 'UNCLEAR',
        note: 'Bỏ qua minh chứng (chưa xác định)',
        userVerdict: 'SKIP',
      };
      next.push(newReview);
      return next;
    });

    if (completesQueue) {
      setIsCheckingEvidence(false);
      setRecheckingIndex(undefined);
      setRecheckingPreviousReview(undefined);
    } else {
      const nextItem = queueItems[1];
      setRecheckingPreviousReview(
        (nextItem as (RevalidationQueueEvidenceItem & { previousReview?: CompletedRevalidationReview }))
          ?.previousReview,
      );
    }

    return completesQueue;
  }, [currentItem, queueItems]);

  const beginEvidenceCheck = useCallback(
    (targetIndex?: number) => {
      if (targetIndex !== undefined && reviewHistory[targetIndex]) {
        const priorHistory = reviewHistory.slice(0, targetIndex);
        const recheckItems = reviewHistory.slice(targetIndex).map((h) => ({
          ...h.item,
          previousReview: h,
        }));
        setReviewHistory(priorHistory);
        setQueueItems(recheckItems);
        setTotalCount(reviewHistory.length);
        setIsCheckingEvidence(true);
        setRecheckingIndex(targetIndex);
        setRecheckingPreviousReview(reviewHistory[targetIndex]);
        return;
      }

      // Recheck all voted items from history
      const votedItems = reviewHistory.map((h) => ({
        ...h.item,
        previousReview: h,
      }));
      setQueueItems(votedItems);
      setTotalCount(votedItems.length);
      setReviewHistory([]);
      setIsCheckingEvidence(true);
      setRecheckingIndex(undefined);
      setRecheckingPreviousReview(reviewHistory[0]);
    },
    [reviewHistory],
  );

  const keepCurrentEvidenceAndNext = useCallback((): boolean => {
    if (!currentItem) return true;

    const prevReview =
      (currentItem as (RevalidationQueueEvidenceItem & { previousReview?: CompletedRevalidationReview }))
        ?.previousReview ?? recheckingPreviousReview;

    const completesQueue = queueItems.length <= 1;

    if (prevReview) {
      setReviewHistory((prev) => [...prev, prevReview]);
    }

    setQueueItems((prev) => prev.slice(1));

    if (completesQueue) {
      setIsCheckingEvidence(false);
      setRecheckingIndex(undefined);
      setRecheckingPreviousReview(undefined);
    } else {
      const nextItem = queueItems[1];
      setRecheckingPreviousReview(
        (nextItem as (RevalidationQueueEvidenceItem & { previousReview?: CompletedRevalidationReview }))
          ?.previousReview,
      );
    }

    return completesQueue;
  }, [currentItem, queueItems, recheckingPreviousReview]);

  const cancelEvidenceCheck = useCallback(() => {
    if (queueItems.length > 0) {
      const remainingReviews: CompletedRevalidationReview[] = queueItems
        .map((item) => {
          return (item as any)?.previousReview ?? recheckingPreviousReview;
        })
        .filter(Boolean) as CompletedRevalidationReview[];

      if (remainingReviews.length > 0) {
        setReviewHistory((prev) => [...prev, ...remainingReviews]);
        setQueueItems([]);
      }
    }
    setIsCheckingEvidence(false);
    setRecheckingIndex(undefined);
    setRecheckingPreviousReview(undefined);
  }, [recheckingPreviousReview, recheckingIndex]);

  const finishReviews = useCallback((): number => {
    const count = reviewHistory.length;
    void queryClient.invalidateQueries({ queryKey: ['revalidation-evidence-queue'] });
    void queryClient.invalidateQueries({ queryKey: ['revalidation-tasks'] });
    void queryClient.invalidateQueries({ queryKey: ['reviewer-stats'] });
    void queryClient.invalidateQueries({ queryKey: ['wallet-balance'] });
    invalidateWalletAndStats();

    setReviewHistory([]);
    setQueueItems([]);
    setIsCheckingEvidence(false);
    setRecheckingIndex(undefined);
    setRecheckingPreviousReview(undefined);
    hasInitializedRef.current = false;
    return count;
  }, [invalidateWalletAndStats, queryClient, reviewHistory.length]);

  const resetWorkflow = useCallback(() => {
    setReviewHistory([]);
    setQueueItems([]);
    setIsCheckingEvidence(false);
    setRecheckingIndex(undefined);
    setRecheckingPreviousReview(undefined);
    hasInitializedRef.current = false;
    void refetch();
  }, [refetch]);

  const refetchQueue = useCallback(async () => {
    const res = await refetch();
    if (res.data?.items) {
      setQueueItems(res.data.items);
      setTotalCount(res.data.total || res.data.items.length);
    }
  }, [refetch]);

  const value: RevalidationWorkflowContextValue = useMemo(
    () => ({
      beginEvidenceCheck,
      cancelEvidenceCheck,
      counts,
      currentItem,
      finishReviews,
      handleVote,
      handleSkip,
      isCheckingEvidence,
      isLoading,
      keepCurrentEvidenceAndNext,
      nextItem,
      progressPercent,
      queueItems,
      recheckingIndex,
      recheckingPreviousReview,
      refetchQueue,
      resetWorkflow,
      reviewHistory,
      reviewPosition,
      totalCount,
    }),
    [
      beginEvidenceCheck,
      cancelEvidenceCheck,
      counts,
      currentItem,
      finishReviews,
      handleVote,
      handleSkip,
      isCheckingEvidence,
      isLoading,
      keepCurrentEvidenceAndNext,
      nextItem,
      progressPercent,
      queueItems,
      recheckingIndex,
      recheckingPreviousReview,
      refetchQueue,
      resetWorkflow,
      reviewHistory,
      reviewPosition,
      totalCount,
    ],
  );

  return (
    <RevalidationWorkflowContext.Provider value={value}>
      {children}
    </RevalidationWorkflowContext.Provider>
  );
}

const fallbackRevalidationWorkflowValue: RevalidationWorkflowContextValue = {
  beginEvidenceCheck: () => {},
  cancelEvidenceCheck: () => {},
  counts: { STILL_ACTIVE: 0, REMOVED: 0, CHANGED: 0, UNCLEAR: 0, INVALID: 0 },
  currentItem: undefined,
  finishReviews: () => 0,
  handleVote: async () => false,
  handleSkip: () => false,
  isCheckingEvidence: false,
  isLoading: false,
  keepCurrentEvidenceAndNext: () => false,
  nextItem: undefined,
  progressPercent: 0,
  queueItems: [],
  recheckingIndex: undefined,
  recheckingPreviousReview: undefined,
  refetchQueue: async () => {},
  resetWorkflow: () => {},
  reviewHistory: [],
  reviewPosition: 0,
  totalCount: 0,
};

export function useRevalidationWorkflow(): RevalidationWorkflowContextValue {
  const context = useContext(RevalidationWorkflowContext);
  return context ?? fallbackRevalidationWorkflowValue;
}
