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

import { useSession } from '@/context/session-provider';
import { useInvalidateWalletAndStats } from '@/feature/credits/hooks/use-wallet';
import {
  useGetRevalidationEvidenceQueue,
  useVoteOnRevalidationEvidence,
} from '../hooks/use-revalidation';
import type {
  RevalDecision,
  RevalidationQueueEvidenceItem,
} from '@/types/revalidationType';

export type RevalidationReviewAction = 'STILL_ACTIVE' | 'REMOVED' | 'CHANGED' | 'UNCLEAR';

export type CompletedRevalidationReview = {
  action: RevalidationReviewAction;
  item: RevalidationQueueEvidenceItem;
  note?: string;
  suggestedSignTypeId?: number;
};

export type RevalidationWorkflowContextValue = {
  beginEvidenceCheck: (targetIndex?: number) => void;
  counts: Record<RevalidationReviewAction, number>;
  currentItem?: RevalidationQueueEvidenceItem;
  finishReviews: () => number;
  handleVote: (
    action: RevalidationReviewAction,
    note?: string,
    suggestedSignTypeId?: number,
  ) => Promise<boolean>;
  isCheckingEvidence: boolean;
  isLoading: boolean;
  nextItem?: RevalidationQueueEvidenceItem;
  progressPercent: number;
  queueItems: RevalidationQueueEvidenceItem[];
  recheckingIndex?: number;
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

  const {
    data: queueResponse,
    isLoading,
    refetch,
  } = useGetRevalidationEvidenceQueue({ pageSize: 50 }, Boolean(session?.accessToken));

  const voteMutation = useVoteOnRevalidationEvidence();

  const [queueItems, setQueueItems] = useState<RevalidationQueueEvidenceItem[]>([]);
  const [reviewHistory, setReviewHistory] = useState<CompletedRevalidationReview[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isCheckingEvidence, setIsCheckingEvidence] = useState(false);
  const [recheckingIndex, setRecheckingIndex] = useState<number | undefined>(undefined);
  const hasInitializedRef = useRef(false);

  // Sync with incoming queue response initially
  useEffect(() => {
    if (queueResponse?.items && !hasInitializedRef.current && reviewHistory.length === 0) {
      setQueueItems(queueResponse.items);
      setTotalCount(queueResponse.total || queueResponse.items.length);
      hasInitializedRef.current = true;
    }
  }, [queueResponse, reviewHistory.length]);

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
      { STILL_ACTIVE: 0, REMOVED: 0, CHANGED: 0, UNCLEAR: 0 },
    );
  }, [reviewHistory]);

  const handleVote = useCallback(
    async (
      action: RevalidationReviewAction,
      note?: string,
      suggestedSignTypeId?: number,
    ): Promise<boolean> => {
      if (!currentItem) return false;

      const itemToVote = currentItem;
      const completesQueue = queueItems.length <= 1;

      // 1. Advance queue state
      setQueueItems((prev) => prev.slice(1));
      setReviewHistory((prev) => [
        ...prev,
        { item: itemToVote, action, note, suggestedSignTypeId },
      ]);

      // 2. Dispatch vote API
      const decisionMap: Record<RevalidationReviewAction, RevalDecision> = {
        STILL_ACTIVE: 'STILL_ACTIVE',
        REMOVED: 'REMOVED',
        CHANGED: 'CHANGED',
        UNCLEAR: 'UNCLEAR',
      };

      try {
        await voteMutation.mutateAsync({
          evidenceId: itemToVote.evidenceId,
          dto: {
            decision: decisionMap[action],
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
    [currentItem, queueItems.length, voteMutation],
  );

  const beginEvidenceCheck = useCallback(
    (targetIndex?: number) => {
      if (targetIndex !== undefined && reviewHistory[targetIndex]) {
        const target = reviewHistory[targetIndex];
        setQueueItems([target.item]);
        setTotalCount(1);
        setIsCheckingEvidence(true);
        setRecheckingIndex(targetIndex);
        setReviewHistory((prev) => prev.filter((_, i) => i !== targetIndex));
        return;
      }

      // Recheck all voted items from history
      const votedItems = reviewHistory.map((h) => h.item);
      setQueueItems(votedItems);
      setTotalCount(votedItems.length);
      setReviewHistory([]);
      setIsCheckingEvidence(false);
      setRecheckingIndex(undefined);
    },
    [reviewHistory],
  );

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
    hasInitializedRef.current = false;
    return count;
  }, [invalidateWalletAndStats, queryClient, reviewHistory.length]);

  const resetWorkflow = useCallback(() => {
    setReviewHistory([]);
    setQueueItems([]);
    setIsCheckingEvidence(false);
    setRecheckingIndex(undefined);
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
      counts,
      currentItem,
      finishReviews,
      handleVote,
      isCheckingEvidence,
      isLoading,
      nextItem,
      progressPercent,
      queueItems,
      recheckingIndex,
      refetchQueue,
      resetWorkflow,
      reviewHistory,
      reviewPosition,
      totalCount,
    }),
    [
      beginEvidenceCheck,
      counts,
      currentItem,
      finishReviews,
      handleVote,
      isCheckingEvidence,
      isLoading,
      nextItem,
      progressPercent,
      queueItems,
      recheckingIndex,
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
  counts: { STILL_ACTIVE: 0, REMOVED: 0, CHANGED: 0, UNCLEAR: 0 },
  currentItem: undefined,
  finishReviews: () => 0,
  handleVote: async () => false,
  isCheckingEvidence: false,
  isLoading: false,
  nextItem: undefined,
  progressPercent: 0,
  queueItems: [],
  recheckingIndex: undefined,
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
