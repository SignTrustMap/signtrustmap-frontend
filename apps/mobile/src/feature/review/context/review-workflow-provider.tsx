import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { useSession } from '@/context/session-provider';
import {
  getReviewHistory,
  getReviewQueue,
  submitReview,
  undoReview,
  type ReviewDecision,
  type ReviewSubmission,
} from '@/feature/review/services/reviews-api';

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
  isSubmitting: boolean;
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
  const [pendingSubmissions, setPendingSubmissions] = useState<ReviewSubmission[]>([]);
  const [reviewHistory, setReviewHistory] = useState<CompletedReview[]>([]);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [checkedReviewIndex, setCheckedReviewIndex] = useState(0);
  const [isRecheckingSubmission, setIsRecheckingSubmission] = useState(false);
  const [recheckingReviewIndex, setRecheckingReviewIndex] = useState<number>();
  const [recheckingPreviousAction, setRecheckingPreviousAction] = useState<ReviewActionType>();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [sessionReviewCount, setSessionReviewCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    setError(undefined);
    try {
      const [queue, history] = await Promise.all([
        getReviewQueue(accessToken),
        getReviewHistory(accessToken),
      ]);
      setPendingSubmissions(queue.submissions);
      setReviewHistory(history);
      setTotalSubmissions(queue.total + history.length);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load review submissions.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    Promise.all([getReviewQueue(accessToken), getReviewHistory(accessToken)])
      .then(([queue, history]) => {
        if (!active) return;
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
  }, [accessToken]);

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
    setSessionReviewCount(0);
    await refresh();
  };

  const goToPreviousCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.max(0, index - 1));
  };

  const goToNextCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.min(reviewHistory.length - 1, index + 1));
  };

  const completeCurrentReview = async (decision: ReviewDecision) => {
    const submission = pendingSubmissions[0];
    if (!submission || !session?.accessToken || isSubmitting) return false;
    const completedRecheckIndex = isRecheckingSubmission ? recheckingReviewIndex : undefined;
    setIsSubmitting(true);
    setError(undefined);

    try {
      await submitReview(submission.id, decision, session.accessToken);
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
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to submit this review.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const undoLastReview = async () => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview || !session?.accessToken || isSubmitting) return false;
    setIsSubmitting(true);
    setError(undefined);
    try {
      if (lastReview.action !== 'reported') {
        await undoReview(lastReview.submission.id, session.accessToken);
      }
      setReviewHistory((history) => history.slice(0, -1));
      setPendingSubmissions((pending) => [lastReview.submission, ...pending]);
      setSessionReviewCount((count) => Math.max(0, count - 1));
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to undo this review.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const reviewCheckedSubmissionAgain = async () => {
    const checkedReview = reviewHistory[checkedReviewIndex];
    if (!checkedReview || !session?.accessToken || isSubmitting) return false;
    setIsSubmitting(true);
    setError(undefined);
    try {
      if (checkedReview.action !== 'reported') {
        await undoReview(checkedReview.submission.id, session.accessToken);
      }
      setReviewHistory((history) => history.filter((_, index) => index !== checkedReviewIndex));
      setPendingSubmissions((pending) => [checkedReview.submission, ...pending]);
      setRecheckingPreviousAction(checkedReview.action);
      setRecheckingReviewIndex(checkedReviewIndex);
      setCheckedReviewIndex(0);
      setIsCheckingSubmission(false);
      setIsRecheckingSubmission(true);
      return true;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to reopen this review.');
      return false;
    } finally {
      setIsSubmitting(false);
    }
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
        isSubmitting,
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
