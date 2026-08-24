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
  checkingSubmission: boolean;
  completeCurrentReview: (action: ReviewActionType) => void;
  finishSubmissionCheck: () => void;
  goToNextCheckedReview: () => void;
  goToPreviousCheckedReview: () => void;
  pendingSubmissions: ReviewSubmission[];
  recheckingPreviousAction?: ReviewActionType;
  recheckingReviewIndex?: number;
  recheckingSubmission: boolean;
  resetReviewWorkflow: () => void;
  reviewCheckedSubmissionAgain: () => void;
  reviewHistory: CompletedReview[];
  undoLastReview: () => void;
};

const ReviewWorkflowContext = createContext<ReviewWorkflowContextValue | undefined>(undefined);

export function ReviewWorkflowProvider({ children }: { children: ReactNode }) {
  const [pendingSubmissions, setPendingSubmissions] = useState(sampleReviewSubmissions);
  const [reviewHistory, setReviewHistory] = useState<CompletedReview[]>([]);
  const [checkingSubmission, setCheckingSubmission] = useState(false);
  const [checkedReviewIndex, setCheckedReviewIndex] = useState(0);
  const [recheckingSubmission, setRecheckingSubmission] = useState(false);
  const [recheckingReviewIndex, setRecheckingReviewIndex] = useState<number>();
  const [recheckingPreviousAction, setRecheckingPreviousAction] = useState<ReviewActionType>();

  const beginSubmissionCheck = () => {
    setCheckedReviewIndex(0);
    setCheckingSubmission(true);
  };

  const finishSubmissionCheck = () => {
    setCheckedReviewIndex(0);
    setCheckingSubmission(false);
  };

  const resetReviewWorkflow = () => {
    setPendingSubmissions(sampleReviewSubmissions);
    setReviewHistory([]);
    setCheckingSubmission(false);
    setCheckedReviewIndex(0);
    setRecheckingSubmission(false);
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
    const completedRecheckIndex = recheckingSubmission ? recheckingReviewIndex : undefined;

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
      setCheckingSubmission(true);
    }
    setRecheckingSubmission(false);
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
    setCheckingSubmission(false);
    setRecheckingSubmission(true);
  };

  return (
    <ReviewWorkflowContext.Provider
      value={{
        beginSubmissionCheck,
        checkedReviewIndex,
        checkingSubmission,
        completeCurrentReview,
        finishSubmissionCheck,
        goToNextCheckedReview,
        goToPreviousCheckedReview,
        pendingSubmissions,
        recheckingPreviousAction,
        recheckingReviewIndex,
        recheckingSubmission,
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
