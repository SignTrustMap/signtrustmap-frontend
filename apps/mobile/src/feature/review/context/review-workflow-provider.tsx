import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

// TODO: Restore mutation imports when batch-submit API is wired up.
// import { useCastVoteOnSignCandidate, useReportSignCandidate, useGetReviewQueue, useGetReviewHistory, useUndoVoteOnCandidate } from '@/feature/review/hooks/use-review';
import { useGetReviewQueue, useGetReviewHistory } from '@/feature/review/hooks/use-review';

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
  isCheckingSubmission: boolean;
  completeCurrentReview: (decision: ReviewDecision) => Promise<boolean>;
  error?: string;
  finishSubmissionCheck: () => void;
  goToNextCheckedReview: () => void;
  goToPreviousCheckedReview: () => void;
  isLoading: boolean;
  pendingSubmissions: ReviewSubmission[];
  refresh: () => Promise<void>;
  recheckingPreviousAction?: ReviewActionType;
  recheckingReviewIndex?: number;
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
  const accountId = session?.account.id;
  // Load on entry/refresh so background updates do not overwrite review ordering.
  const { refetch: refetchQueue } = useGetReviewQueue(undefined, false);
  const { refetch: refetchHistory } = useGetReviewHistory(false);
  const refetchWorkflow = useCallback(async () => {
    const [queue, history] = await Promise.all([
      refetchQueue({ throwOnError: true }),
      refetchHistory({ throwOnError: true }),
    ]);
    return { data: queue.data && history.data ? { queue: queue.data, history: history.data } : undefined };
  }, [refetchQueue, refetchHistory]);
  // TODO: Restore mutation hooks when batch-submit API is wired up.
  // const { mutateAsync: castVote } = useCastVoteOnSignCandidate();
  // const { mutateAsync: reportCandidate } = useReportSignCandidate();
  // const { mutateAsync: undoVote } = useUndoVoteOnCandidate();
  const [pendingSubmissions, setPendingSubmissions] = useState<ReviewSubmission[]>([]);
  const [reviewHistory, setReviewHistory] = useState<CompletedReview[]>([]);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [checkedReviewIndex, setCheckedReviewIndex] = useState(0);
  const [isRecheckingSubmission, setIsRecheckingSubmission] = useState(false);
  const [recheckingReviewIndex, setRecheckingReviewIndex] = useState<number>();
  const [recheckingPreviousAction, setRecheckingPreviousAction] = useState<ReviewActionType>();
  const [isLoading, setIsLoading] = useState(true);
  // isSubmitting is unused while review actions are local-only; re-enable with the batch submit API.
  const [error, setError] = useState<string>();
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [sessionReviewCount, setSessionReviewCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const { data } = await refetchWorkflow();
      console.log('refresh data', data);
      if (!data) return;
      const { queue, history } = data;
      console.log('refresh queue', queue);
      setPendingSubmissions(queue.submissions);
      setReviewHistory(history);
      setTotalSubmissions(queue.total + history.length);
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
      .then(({ data }) => {
        if (!active || !data) return;
        const { queue, history } = data;
        setPendingSubmissions(queue.submissions);
        setReviewHistory(history);
        setTotalSubmissions(queue.total + history.length);
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
    // TODO: Call the batch-submit API here with the accumulated reviewHistory before clearing.
    // await submitReviewBatch(reviewHistory, session?.accessToken);

    setIsCheckingSubmission(false);
    setCheckedReviewIndex(0);
    setIsRecheckingSubmission(false);
    setRecheckingReviewIndex(undefined);
    setRecheckingPreviousAction(undefined);
    setReviewHistory([]);
    setSessionReviewCount(0);

    // TODO: Re-enable refresh() after the submit API is wired up to reload the queue.
    // await refresh();
  };

  const goToPreviousCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.max(0, index - 1));
  };

  const goToNextCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.min(reviewHistory.length - 1, index + 1));
  };

  const completeCurrentReview = async (decision: ReviewDecision) => {
    const submission = pendingSubmissions[0];
    if (!submission) return false;
    const completedRecheckIndex = isRecheckingSubmission ? recheckingReviewIndex : undefined;

    // TODO: API calls are deferred to the final submit step.
    // When the reviewer hits "Finish", all accumulated decisions will be sent in one batch.
    //
    // const params = { candidateId: submission.id };
    // if (decision.action === 'reported') {
    //   await reportCandidate({
    //     params, request: {
    //       reason: decision.declineNote || decision.declineReason || 'Reported by reviewer',
    //     }
    //   });
    // } else {
    //   await castVote({
    //     params, request: {
    //       vote: decision.action === 'approved' ? 1 : -1,
    //       ...(decision.declineReason ? { declineReason: decision.declineReason } : {}),
    //       ...(decision.declineNote ? { declineNote: decision.declineNote } : {}),
    //     }
    //   });
    // }

    setReviewHistory((history) => {
      const completedReview = { action: decision.action, submission };
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

  const undoLastReview = async () => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return false;

    // TODO: undo vote API call deferred to batch submit.
    // if (lastReview.action !== 'reported') {
    //   await undoVote({ params: { candidateId: lastReview.submission.id } });
    // }

    setReviewHistory((history) => history.slice(0, -1));
    setPendingSubmissions((pending) => [lastReview.submission, ...pending]);
    setSessionReviewCount((count) => Math.max(0, count - 1));
    return true;
  };

  const reviewCheckedSubmissionAgain = async () => {
    const checkedReview = reviewHistory[checkedReviewIndex];
    if (!checkedReview) return false;

    // TODO: undo vote API call deferred to batch submit.
    // if (checkedReview.action !== 'reported') {
    //   await undoVote({ params: { candidateId: checkedReview.submission.id } });
    // }

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
