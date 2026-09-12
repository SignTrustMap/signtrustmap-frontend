import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { useGetReviewQueue, useGetReviewHistory, useCastVoteOnSignCandidate, useReportSignCandidate, useUndoVoteOnCandidate } from '@/feature/review/hooks/use-review';
import { useSession } from '@/context/session-provider';
import {
  type ReviewDecision,
  type ReviewSubmission,
} from '@/api/reviews/review-workflow';

export type ReviewActionType = 'approved' | 'declined' | 'reported';

export type CompletedReview = {
  action: ReviewActionType;
  submission: ReviewSubmission;
};

type ReviewWorkflowContextValue = {
  beginSubmissionCheck: () => void;
  checkedReviewIndex: number;
  checkingSubmission: boolean;
  isCheckingSubmission: boolean;
  completeCurrentReview: (actionOrDecision: ReviewActionType | ReviewDecision, details?: { declineReason?: string; declineNote?: string }) => Promise<boolean>;
  error?: string;
  finishSubmissionCheck: () => void;
  goToNextCheckedReview: () => void;
  goToPreviousCheckedReview: () => void;
  isLoading: boolean;
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
  totalSubmissions: number;
  undoLastReview: () => Promise<boolean>;
};

const ReviewWorkflowContext = createContext<ReviewWorkflowContextValue | undefined>(undefined);

export function ReviewWorkflowProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const accessToken = session?.accessToken;
  const accountId = session?.account?.id;

  const { refetch: refetchQueue } = useGetReviewQueue(undefined, false);
  const { refetch: refetchHistory } = useGetReviewHistory(false);

  const { mutateAsync: castVote } = useCastVoteOnSignCandidate();
  const { mutateAsync: reportCandidate } = useReportSignCandidate();
  const { mutateAsync: undoVote } = useUndoVoteOnCandidate();

  const [pendingSubmissions, setPendingSubmissions] = useState<ReviewSubmission[]>([]);
  const [reviewHistory, setReviewHistory] = useState<CompletedReview[]>([]);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [checkedReviewIndex, setCheckedReviewIndex] = useState(0);
  const [isRecheckingSubmission, setIsRecheckingSubmission] = useState(false);
  const [recheckingReviewIndex, setRecheckingReviewIndex] = useState<number>();
  const [recheckingPreviousAction, setRecheckingPreviousAction] = useState<ReviewActionType>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [sessionReviewCount, setSessionReviewCount] = useState(0);

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
      setTotalSubmissions(data.queue.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load review submissions.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, refetchWorkflow]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    refetchWorkflow()
      .then((data) => {
        if (!active || !data?.queue) return;
        setPendingSubmissions(data.queue.submissions);
        setTotalSubmissions(data.queue.total);
        setError(undefined);
      })
      .catch((cause: unknown) => {
        if (active) setError(cause instanceof Error ? cause.message : 'Unable to load review submissions.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [accessToken, accountId, refetchWorkflow]);

  const beginSubmissionCheck = () => {
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(true);
  };

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
    details?: { declineReason?: string; declineNote?: string }
  ): Promise<boolean> => {
    const submission = pendingSubmissions[0];
    if (!submission) return false;
    const completedRecheckIndex = isRecheckingSubmission ? recheckingReviewIndex : undefined;

    const action: ReviewActionType = typeof actionOrDecision === 'string' ? actionOrDecision : actionOrDecision.action;
    const reason = details?.declineReason || (typeof actionOrDecision === 'object' ? actionOrDecision.declineReason : undefined);
    const note = details?.declineNote || (typeof actionOrDecision === 'object' ? actionOrDecision.declineNote : undefined);

    const params = { candidateId: submission.id };

    try {
      if (action === 'reported') {
        await reportCandidate({
          params,
          request: {
            reason: note || reason || 'Reported by reviewer',
          },
        });
      } else {
        await castVote({
          params,
          request: {
            vote: action === 'approved' ? 1 : -1,
            ...(reason ? { declineReason: reason } : {}),
            ...(note ? { declineNote: note } : {}),
          },
        });
      }
    } catch {
    }

    setReviewHistory((history) => {
      const completedReview = { action, submission };
      if (completedRecheckIndex !== undefined) {
        const nextHistory = [...history];
        nextHistory.splice(completedRecheckIndex, 0, completedReview);
        return nextHistory;
      }
      return [...history, completedReview];
    });

    setPendingSubmissions((pending) => pending.slice(1));
    if (completedRecheckIndex !== undefined) {
      setCheckedReviewIndex(completedRecheckIndex);
      setIsCheckingSubmission(true);
    }
    setIsRecheckingSubmission(false);
    setRecheckingReviewIndex(undefined);
    setRecheckingPreviousAction(undefined);
    setSessionReviewCount((count) => count + 1);
    return true;
  };

  const undoLastReview = async (): Promise<boolean> => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return false;

    try {
      if (lastReview.action !== 'reported') {
        await undoVote({ params: { candidateId: lastReview.submission.id } });
      }
    } catch {
    }

    setReviewHistory((history) => history.slice(0, -1));
    setPendingSubmissions((pending) => [lastReview.submission, ...pending]);
    setSessionReviewCount((count) => Math.max(0, count - 1));
    return true;
  };

  const reviewCheckedSubmissionAgain = async (): Promise<boolean> => {
    const checkedReview = reviewHistory[checkedReviewIndex];
    if (!checkedReview) return false;

    try {
      if (checkedReview.action !== 'reported') {
        await undoVote({ params: { candidateId: checkedReview.submission.id } });
      }
    } catch {
    }

    setReviewHistory((history) => history.filter((_, index) => index !== checkedReviewIndex));
    setPendingSubmissions((pending) => [checkedReview.submission, ...pending]);
    setRecheckingPreviousAction(checkedReview.action);
    setRecheckingReviewIndex(checkedReviewIndex);
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(false);
    setIsRecheckingSubmission(true);
    return true;
  };

  return (
    <ReviewWorkflowContext.Provider
      value={{
        beginSubmissionCheck,
        checkedReviewIndex,
        checkingSubmission: isCheckingSubmission,
        isCheckingSubmission,
        completeCurrentReview,
        error,
        finishSubmissionCheck,
        goToNextCheckedReview,
        goToPreviousCheckedReview,
        isLoading,
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
  if (!context) throw new Error('useReviewWorkflow must be used within ReviewWorkflowProvider');
  return context;
}