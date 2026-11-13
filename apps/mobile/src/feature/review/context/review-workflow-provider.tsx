import { createContext, type ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { QueryClientContext } from '@tanstack/react-query';
import { useSegments } from 'expo-router';
import {
  reviewKeys,
  useGetReviewQueue,
  useGetReviewHistory,
  useCastVoteOnSignCandidate,
  useReportSignCandidate,
  useReportMissingType,
  useSkipSign,
  useUndoVoteOnCandidate,
} from '@/feature/review/hooks/use-review';
import { useSession } from '@/context/session-provider';
import {
  type ReviewDecision,
  type ReviewSubmission,
} from '@/api/reviews/review-workflow';
import type { CreateMissingTypeReportDto } from '@/types/reviewsType';
import {
  REVIEW_WORKFLOW_PROVIDER_REQUIRED_MESSAGE,
  UNABLE_TO_LOAD_REVIEW_SUBMISSIONS_MESSAGE,
} from '@/constants/message';

export type ReviewActionType = 'approved' | 'declined' | 'reported' | 'skipped' | 'reported_new_sign';

export type CompletedReview = {
  action: ReviewActionType;
  submission: ReviewSubmission;
};

export type ReviewWorkflowContextValue = {
  beginSubmissionCheck: (targetSubmissionIndex?: number) => void;
  cancelSubmissionCheck?: () => void;
  checkedReviewIndex: number;
  checkingSubmission: boolean;
  isCheckingSubmission: boolean;
  completeCurrentReview: (
    actionOrDecision: ReviewActionType | ReviewDecision,
    details?: {
      declineReason?: string;
      declineNote?: string;
      suggestedSignTypeId?: number | string;
      newSignReport?: CreateMissingTypeReportDto;
    }
  ) => Promise<boolean>;
  error?: string;
  finishSubmissionCheck: () => void;
  goToNextCheckedReview: () => void;
  goToPreviousCheckedReview: () => void;
  isLoading: boolean;
  jumpToSubmissionIndex?: (index: number) => void;
  keepCurrentReviewAndNext?: () => boolean;
  pendingSubmissions: ReviewSubmission[];
  refresh: () => Promise<void>;
  recheckingPreviousAction?: ReviewActionType;
  recheckingReviewIndex?: number;
  recheckingSubmission: boolean;
  isRecheckingSubmission: boolean;
  resetReviewWorkflow: () => Promise<void>;
  reviewCheckedSubmissionAgain: () => Promise<boolean>;
  reviewHistory: CompletedReview[];
  sessionReviewCount: number;
  skipCurrentReview: () => Promise<boolean>;
  totalSubmissions: number;
  undoLastReview: () => Promise<boolean>;
};

export const ReviewWorkflowContext = createContext<ReviewWorkflowContextValue | undefined>(undefined);

export function ReviewWorkflowProvider({ children }: { children: ReactNode }) {
  const queryClient = useContext(QueryClientContext);
  const { session } = useSession();
  const accessToken = session?.accessToken;
  const accountId = session?.account?.id;

  const { refetch: refetchQueue } = useGetReviewQueue(undefined, false);
  const { refetch: refetchHistory } = useGetReviewHistory(false);

  const { mutateAsync: castVote } = useCastVoteOnSignCandidate();
  const { mutateAsync: reportCandidate } = useReportSignCandidate();
  const { mutateAsync: reportMissingTypeMutation } = useReportMissingType();
  const { mutateAsync: skipSign } = useSkipSign();
  const { mutateAsync: undoVote } = useUndoVoteOnCandidate();

  const [pendingSubmissions, setPendingSubmissions] = useState<ReviewSubmission[]>([]);
  const [initialQueueSubmissions, setInitialQueueSubmissions] = useState<ReviewSubmission[]>([]);
  const [reviewHistory, setReviewHistory] = useState<CompletedReview[]>([]);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [checkedReviewIndex, setCheckedReviewIndex] = useState(0);
  const [isRecheckingSubmission, setIsRecheckingSubmission] = useState(false);
  const [recheckingReviewIndex, setRecheckingReviewIndex] = useState<number>();
  const [recheckingPreviousAction, setRecheckingPreviousAction] = useState<ReviewActionType>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [sessionReviewCount, setSessionReviewCount] = useState(0);
  const hasLoadedRef = useRef(false);

  const segments = useSegments();
  const rawSegments = segments as string[];
  const isReviewActive = rawSegments.includes('submission-review') || rawSegments.includes('submission-summary');

  const refetchWorkflow = useCallback(async () => {
    const [queueResult, historyResult] = await Promise.all([
      refetchQueue({ throwOnError: true }),
      refetchHistory({ throwOnError: true }),
    ]);
    return {
      queue: queueResult.data,
      history: historyResult.data || [],
    };
  }, [refetchQueue, refetchHistory]);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const data = await refetchWorkflow();
      if (!data?.queue) return;
      setPendingSubmissions(data.queue.submissions);
      setInitialQueueSubmissions(data.queue.submissions);
      setTotalSubmissions(data.queue.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : UNABLE_TO_LOAD_REVIEW_SUBMISSIONS_MESSAGE);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refetchWorkflow]);

  useEffect(() => {
    if (!accessToken) {
      hasLoadedRef.current = false;
      return;
    }
    // Only load initial queue when actively on a review screen, preventing background
    // cache invalidations and calls when browsing other work tabs or app sections
    if (!isReviewActive) return;

    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    setIsLoading(true);
    let active = true;
    refetchWorkflow()
      .then((data) => {
        if (!active || !data?.queue) return;
        setPendingSubmissions(data.queue.submissions);
        setInitialQueueSubmissions(data.queue.submissions);
        setTotalSubmissions(data.queue.total);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : UNABLE_TO_LOAD_REVIEW_SUBMISSIONS_MESSAGE);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken, accountId, isReviewActive, refetchWorkflow]);

  const jumpToSubmissionIndex = useCallback(
    (targetIndex: number) => {
      if (initialQueueSubmissions.length === 0) return;
      const clampedIndex = Math.max(0, Math.min(targetIndex, initialQueueSubmissions.length));
      if (clampedIndex >= initialQueueSubmissions.length) {
        setPendingSubmissions([]);
        return;
      }
      if (
        reviewHistory.length === clampedIndex &&
        pendingSubmissions[0]?.id === initialQueueSubmissions[clampedIndex]?.id
      ) {
        return;
      }
      setPendingSubmissions(initialQueueSubmissions.slice(clampedIndex));
      setTotalSubmissions(initialQueueSubmissions.length);
      setIsCheckingSubmission(false);
      setIsRecheckingSubmission(false);
      setRecheckingReviewIndex(undefined);
      setRecheckingPreviousAction(undefined);
    },
    [initialQueueSubmissions, reviewHistory.length, pendingSubmissions],
  );

  const beginSubmissionCheck = (targetSubmissionIndex?: number) => {
    if (targetSubmissionIndex !== undefined && reviewHistory[targetSubmissionIndex]) {
      const priorHistory = reviewHistory.slice(0, targetSubmissionIndex);
      const recheckItems = reviewHistory.slice(targetSubmissionIndex).map(
        (target) =>
          ({
            ...target.submission,
            previousAction: target.action,
          }) as ReviewSubmission,
      );
      setReviewHistory(priorHistory);
      setPendingSubmissions(recheckItems);
      setTotalSubmissions(reviewHistory.length);
      setIsRecheckingSubmission(true);
      setRecheckingReviewIndex(targetSubmissionIndex);
      setRecheckingPreviousAction((recheckItems[0] as any)?.previousAction);
      setCheckedReviewIndex(0);
      setIsCheckingSubmission(false);
      return;
    }

    const votedSubmissions = reviewHistory.map((item) => ({
      ...item.submission,
      previousAction: item.action,
    }));
    setPendingSubmissions(votedSubmissions as ReviewSubmission[]);
    setTotalSubmissions(votedSubmissions.length);
    setReviewHistory([]);
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(false);
    setIsRecheckingSubmission(true);
    setRecheckingReviewIndex(undefined);
    setRecheckingPreviousAction(reviewHistory[0]?.action);
  };

  const cancelSubmissionCheck = useCallback(() => {
    if (pendingSubmissions.length > 0) {
      const remainingReviews: CompletedReview[] = pendingSubmissions
        .map((sub) => {
          const action =
            (sub as (ReviewSubmission & { previousAction?: ReviewActionType }))?.previousAction ??
            recheckingPreviousAction;
          if (!action) return null;
          return { action, submission: sub };
        })
        .filter(Boolean) as CompletedReview[];

      if (remainingReviews.length > 0) {
        setReviewHistory((history) => [...history, ...remainingReviews]);
        setPendingSubmissions([]);
      }
    }
    setIsCheckingSubmission(false);
    setIsRecheckingSubmission(false);
    setRecheckingReviewIndex(undefined);
    setRecheckingPreviousAction(undefined);
  }, [pendingSubmissions, recheckingPreviousAction]);

  const keepCurrentReviewAndNext = useCallback((): boolean => {
    if (pendingSubmissions.length === 0) return true;
    const current = pendingSubmissions[0];
    const prevAction =
      (current as (ReviewSubmission & { previousAction?: ReviewActionType }))?.previousAction ??
      recheckingPreviousAction ??
      'skipped';
    const completes = pendingSubmissions.length <= 1;

    setReviewHistory((history) => {
      const keptReview: CompletedReview = {
        action: prevAction,
        submission: current,
      };
      return [...history, keptReview];
    });

    setPendingSubmissions((pending) => pending.slice(1));
    setSessionReviewCount((count) => count + 1);

    if (completes) {
      setIsCheckingSubmission(false);
      setIsRecheckingSubmission(false);
      setRecheckingReviewIndex(undefined);
      setRecheckingPreviousAction(undefined);
    } else {
      const nextItem = pendingSubmissions[1];
      setRecheckingPreviousAction(
        (nextItem as (ReviewSubmission & { previousAction?: ReviewActionType }))?.previousAction,
      );
    }

    return completes;
  }, [pendingSubmissions, recheckingPreviousAction]);

  const finishSubmissionCheck = () => {
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(false);
  };

  const resetReviewWorkflow = async () => {
    setIsCheckingSubmission(false);
    setCheckedReviewIndex(0);
    setIsRecheckingSubmission(false);
    setRecheckingReviewIndex(undefined);
    setRecheckingPreviousAction(undefined);
    setReviewHistory([]);
    setSessionReviewCount(0);
    setInitialQueueSubmissions([]);
    hasLoadedRef.current = false;
    void queryClient?.invalidateQueries({ queryKey: reviewKeys.all(accountId) });
    await refresh();
  };

  const goToPreviousCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.max(0, index - 1));
  };

  const goToNextCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.min(reviewHistory.length - 1, index + 1));
  };

  const completeCurrentReview = async (
    actionOrDecision: ReviewActionType | ReviewDecision,
    details?: {
      declineReason?: string;
      declineNote?: string;
      suggestedSignTypeId?: number | string;
      newSignReport?: CreateMissingTypeReportDto;
    }
  ): Promise<boolean> => {
    const submission = pendingSubmissions[0];
    if (!submission) return false;
    const completedRecheckIndex = isRecheckingSubmission ? recheckingReviewIndex : undefined;

    const action: ReviewActionType = typeof actionOrDecision === 'string' ? actionOrDecision : actionOrDecision.action;
    const reason = details?.declineReason || (typeof actionOrDecision === 'object' ? actionOrDecision.declineReason : undefined);
    const note = details?.declineNote || (typeof actionOrDecision === 'object' ? actionOrDecision.declineNote : undefined);
    const suggestedSignTypeId = (details as any)?.suggestedSignTypeId ?? (typeof actionOrDecision === 'object' ? (actionOrDecision as any).suggestedSignTypeId : undefined);

    // 1. Immediately update UI state optimistically so review cards advance with zero lag
    setReviewHistory((history) => {
      const completedReview = { action, submission };
      return [...history, completedReview];
    });

    const completes = pendingSubmissions.length <= 1;
    setPendingSubmissions((pending) => pending.slice(1));
    if (completes) {
      setIsCheckingSubmission(false);
      setIsRecheckingSubmission(false);
      setRecheckingReviewIndex(undefined);
      setRecheckingPreviousAction(undefined);
    } else {
      const nextItem = pendingSubmissions[1];
      setRecheckingPreviousAction(
        (nextItem as (ReviewSubmission & { previousAction?: ReviewActionType }))?.previousAction,
      );
    }
    setSessionReviewCount((count) => count + 1);

    // 2. Dispatch backend network call in background without blocking state progression
    const params = { candidateId: submission.id };
    try {
      if (action === 'reported_new_sign') {
        if (details?.newSignReport) {
          const proposedName =
            details.newSignReport.proposedName?.trim() ||
            submission.title ||
            'Biển mới đề xuất';
          await reportMissingTypeMutation({
            ...details.newSignReport,
            candidateId: submission.id,
            proposedName,
            description:
              details.newSignReport.description ||
              details.declineNote ||
              details.declineReason ||
              'Báo cáo biển chưa có trong danh mục chuẩn QCVN 41:2019',
          });
        }
      } else if (action === 'reported') {
        await reportCandidate({
          params,
          request: {
            reason: note || reason || 'Reported by reviewer',
          },
        });
      } else if (action === 'skipped') {
        await skipSign({
          params,
        });
      } else {
        await castVote({
          params,
          request: {
            vote: action === 'approved' ? 1 : -1,
            ...(suggestedSignTypeId != null ? { suggestedSignTypeId: Number(suggestedSignTypeId) } : {}),
            ...(reason ? { declineReason: reason } : {}),
            ...(note ? { declineNote: note } : {}),
          },
        });
      }
    } catch (err) {
      console.warn('Failed to submit review action:', err);
    }

    return true;
  };

  const undoLastReview = async (): Promise<boolean> => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return false;

    setReviewHistory((history) => history.slice(0, -1));
    setPendingSubmissions((pending) => [lastReview.submission, ...pending]);
    setSessionReviewCount((count) => Math.max(0, count - 1));

    try {
      if (lastReview.action === 'approved' || lastReview.action === 'declined') {
        await undoVote({ params: { candidateId: lastReview.submission.id } });
      }
    } catch (err) {
      console.warn('Failed to undo vote:', err);
    }

    return true;
  };

  const reviewCheckedSubmissionAgain = async (): Promise<boolean> => {
    if (reviewHistory[checkedReviewIndex]) {
      beginSubmissionCheck(checkedReviewIndex);
      return true;
    }
    return false;
  };

  const skipCurrentReview = (): Promise<boolean> => {
    return completeCurrentReview('skipped');
  };

  return (
    <ReviewWorkflowContext.Provider
      value={{
        beginSubmissionCheck,
        cancelSubmissionCheck,
        checkedReviewIndex,
        checkingSubmission: isCheckingSubmission,
        isCheckingSubmission,
        completeCurrentReview,
        error,
        finishSubmissionCheck,
        goToNextCheckedReview,
        goToPreviousCheckedReview,
        isLoading,
        jumpToSubmissionIndex,
        keepCurrentReviewAndNext,
        pendingSubmissions,
        refresh,
        recheckingPreviousAction,
        recheckingReviewIndex,
        recheckingSubmission: isRecheckingSubmission,
        isRecheckingSubmission,
        resetReviewWorkflow,
        reviewCheckedSubmissionAgain,
        reviewHistory,
        sessionReviewCount,
        skipCurrentReview,
        totalSubmissions,
        undoLastReview,
      }}
    >
      {children}
    </ReviewWorkflowContext.Provider>
  );
}

export function useReviewWorkflow() {
  const context = useContext(ReviewWorkflowContext);
  if (!context) throw new Error(REVIEW_WORKFLOW_PROVIDER_REQUIRED_MESSAGE);
  return context;
}