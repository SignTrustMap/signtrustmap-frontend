import { createContext, type ReactNode, useContext, useState } from 'react';

import {
  sampleReviewSubmissions,
  type ReviewSubmission,
} from '@/feature/review/data/sample-submissions';

export type ReviewActionType = 'approved' | 'declined' | 'reported';

export type CompletedReview = {
  action: ReviewActionType;
  submission: ReviewSubmission;
};

type ReviewWorkflowContextValue = {
  beginSubmissionCheck: () => void;
  checkedReviewIndex: number;
  isCheckingSubmission: boolean;
  completeCurrentReview: (action: ReviewActionType) => void;
  finishSubmissionCheck: () => void;
  goToNextCheckedReview: () => void;
  goToPreviousCheckedReview: () => void;
  pendingSubmissions: ReviewSubmission[];
  recheckingPreviousAction?: ReviewActionType;
  recheckingReviewIndex?: number;
  isRecheckingSubmission: boolean;
  resetReviewWorkflow: () => void;
  reviewCheckedSubmissionAgain: () => void;
  reviewHistory: CompletedReview[];
  undoLastReview: () => void;
};

const ReviewWorkflowContext = createContext<ReviewWorkflowContextValue | undefined>(undefined);

export function ReviewWorkflowProvider({ children }: { children: ReactNode }) {
  const [pendingSubmissions, setPendingSubmissions] = useState(sampleReviewSubmissions);
  const [reviewHistory, setReviewHistory] = useState<CompletedReview[]>([]);
  const [isCheckingSubmission, setIsCheckingSubmission] = useState(false);
  const [checkedReviewIndex, setCheckedReviewIndex] = useState(0);
  const [isRecheckingSubmission, setIsRecheckingSubmission] = useState(false);
  const [recheckingReviewIndex, setRecheckingReviewIndex] = useState<number>();
  const [recheckingPreviousAction, setRecheckingPreviousAction] = useState<ReviewActionType>();

  const beginSubmissionCheck = () => {
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(true);
  };

  const finishSubmissionCheck = () => {
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(false);
  };

  const resetReviewWorkflow = () => {
    setPendingSubmissions(sampleReviewSubmissions);
    setReviewHistory([]);
    setIsCheckingSubmission(false);
    setCheckedReviewIndex(0);
    setIsRecheckingSubmission(false);
    setRecheckingReviewIndex(undefined);
    setRecheckingPreviousAction(undefined);
  };

  const goToPreviousCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.max(0, index - 1));
  };

  const goToNextCheckedReview = () => {
    setCheckedReviewIndex((index) => Math.min(reviewHistory.length - 1, index + 1));
  };

  const completeCurrentReview = (action: ReviewActionType) => {
    const submission = pendingSubmissions[0];
    if (!submission) return;
    const completedRecheckIndex = isRecheckingSubmission ? recheckingReviewIndex : undefined;

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
  };

  const undoLastReview = () => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return;

    setReviewHistory((history) => history.slice(0, -1));
    setPendingSubmissions((pending) => [lastReview.submission, ...pending]);
  };

  const reviewCheckedSubmissionAgain = () => {
    const checkedReview = reviewHistory[checkedReviewIndex];
    if (!checkedReview) return;

    setReviewHistory((history) => history.filter((_, index) => index !== checkedReviewIndex));
    setPendingSubmissions((pending) => [checkedReview.submission, ...pending]);
    setRecheckingPreviousAction(checkedReview.action);
    setRecheckingReviewIndex(checkedReviewIndex);
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(false);
    setIsRecheckingSubmission(true);
  };

  return (
    <ReviewWorkflowContext.Provider
      value={{
        beginSubmissionCheck,
        checkedReviewIndex,
        isCheckingSubmission,
        completeCurrentReview,
        finishSubmissionCheck,
        goToNextCheckedReview,
        goToPreviousCheckedReview,
        pendingSubmissions,
        recheckingPreviousAction,
        recheckingReviewIndex,
        isRecheckingSubmission,
        resetReviewWorkflow,
        reviewCheckedSubmissionAgain,
        reviewHistory,
        undoLastReview,
      }}
    >
      {children}
    </ReviewWorkflowContext.Provider>
  );
}

export function useReviewWorkflow() {
  const context = useContext(ReviewWorkflowContext);

  if (!context) {
    throw new Error('useReviewWorkflow must be used within ReviewWorkflowProvider');
  }

  return context;
}
