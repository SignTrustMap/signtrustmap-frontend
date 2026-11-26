import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
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
import { getCandidateSignDetails } from '@/api/reviews/review';
import {
  toSubmission,
  type ReviewDecision,
  type ReviewSubmission,
} from '@/api/reviews/review-workflow';
import type { ReviewHistoryRecord } from '@/feature/review/components/review-history-item-card';
import type { CreateMissingTypeReportDto } from '@/types/reviewsType';
import {
  REVIEW_WORKFLOW_PROVIDER_REQUIRED_MESSAGE,
  UNABLE_TO_LOAD_REVIEW_SUBMISSIONS_MESSAGE,
} from '@/constants/message';
import { fetchFreshGpsLocation } from '@/feature/navigation/utils/gps';

export type ReviewActionType =
  | 'approved'
  | 'declined'
  | 'reported'
  | 'skipped'
  | 'reported_new_sign';

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
      questClaimId?: string;
    },
  ) => Promise<boolean>;
  ensureCandidateInQueue?: (candidateId: string) => Promise<boolean>;
  error?: string;
  finishSubmissionCheck: () => void;
  goToNextCheckedReview: () => void;
  goToPreviousCheckedReview: () => void;
  isLoading: boolean;
  isSubmittingReview?: boolean;
  jumpToSubmissionIndex?: (index: number) => void;
  jumpToSubmissionById?: (id: string) => void;
  keepCurrentReviewAndNext?: () => boolean;
  loadSubmissionForEdit?: (record: ReviewHistoryRecord) => void;
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

export const ReviewWorkflowContext = createContext<ReviewWorkflowContextValue | undefined>(
  undefined,
);

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
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const inFlightVotesRef = useRef<Set<string>>(new Set());
  const [error, setError] = useState<string>();
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [sessionReviewCount, setSessionReviewCount] = useState(0);
  const hasLoadedRef = useRef(false);

  const segments = useSegments();
  const rawSegments = segments as string[];
  const isReviewActive =
    rawSegments.includes('submission-review') || rawSegments.includes('submission-summary');

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
      setError(UNABLE_TO_LOAD_REVIEW_SUBMISSIONS_MESSAGE);
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
        if (active)
          setError(
            cause instanceof Error ? cause.message : UNABLE_TO_LOAD_REVIEW_SUBMISSIONS_MESSAGE,
          );
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
      // Never slice earlier than reviewHistory.length to prevent resurrecting already-voted items
      const effectiveIndex = Math.max(reviewHistory.length, targetIndex);
      const clampedIndex = Math.max(0, Math.min(effectiveIndex, initialQueueSubmissions.length));
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

  const beginSubmissionCheck = useCallback(
    (targetSubmissionIndex?: number) => {
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
    },
    [reviewHistory],
  );

  const jumpToSubmissionById = useCallback(
    (targetId: string) => {
      if (!targetId) return;

      // 1. If already the current pending submission, nothing to do
      if (pendingSubmissions[0]?.id === targetId) return;

      // 2. If it exists in remaining pending submissions, bring it to the front
      const pendingIdx = pendingSubmissions.findIndex((s) => s.id === targetId);
      if (pendingIdx > 0) {
        setPendingSubmissions((prev) => {
          const target = prev[pendingIdx];
          return [target, ...prev.slice(0, pendingIdx), ...prev.slice(pendingIdx + 1)];
        });
        setIsCheckingSubmission(false);
        setIsRecheckingSubmission(false);
        setRecheckingReviewIndex(undefined);
        setRecheckingPreviousAction(undefined);
        return;
      }

      // 3. If it is already in reviewHistory, enter recheck mode for it (which safely undos vote before re-casting)
      const historyIdx = reviewHistory.findIndex((h) => h.submission.id === targetId);
      if (historyIdx !== -1) {
        beginSubmissionCheck(historyIdx);
      }
    },
    [beginSubmissionCheck, pendingSubmissions, reviewHistory],
  );

  const ensureCandidateInQueue = useCallback(
    async (candidateId: string): Promise<boolean> => {
      if (!candidateId) return false;

      if (pendingSubmissions[0]?.id === candidateId) return true;

      if (
        pendingSubmissions.some((s) => s.id === candidateId) ||
        reviewHistory.some((h) => h.submission.id === candidateId)
      ) {
        jumpToSubmissionById(candidateId);
        return true;
      }

      if (!accessToken) return false;

      try {
        const res: any = await getCandidateSignDetails({ candidateId }, accessToken);
        const candidate = res?.candidate;
        if (!candidate?.id) return false;

        if (
          candidate.status &&
          candidate.status !== 'PENDING_REVIEW' &&
          candidate.status !== 'IN_CONSENSUS'
        ) {
          return false;
        }

        const mergedCandidate = {
          ...candidate,
          locationContext: res?.locationContext ?? candidate.locationContext,
          possibleSigns: res?.possibleSigns ?? candidate.possibleSigns,
          remedySigns: res?.remedySigns ?? candidate.remedySigns,
        };
        const submission = toSubmission(mergedCandidate);

        setPendingSubmissions((prev) => {
          if (prev.some((s) => s.id === submission.id)) {
            const idx = prev.findIndex((s) => s.id === submission.id);
            return idx > 0
              ? [prev[idx], ...prev.slice(0, idx), ...prev.slice(idx + 1)]
              : prev;
          }
          return [submission, ...prev];
        });
        setInitialQueueSubmissions((prev) =>
          prev.some((s) => s.id === submission.id) ? prev : [submission, ...prev],
        );
        setTotalSubmissions((prev) => Math.max(prev, pendingSubmissions.length + 1));
        setIsCheckingSubmission(false);
        setIsRecheckingSubmission(false);
        setRecheckingReviewIndex(undefined);
        setRecheckingPreviousAction(undefined);
        return true;
      } catch (err) {
        console.warn('[ReviewWorkflow] Failed to load claimed candidate detail:', err);
        return false;
      }
    },
    [accessToken, beginSubmissionCheck, jumpToSubmissionById, pendingSubmissions, reviewHistory],
  );

  const cancelSubmissionCheck = useCallback(() => {
    if (pendingSubmissions.length > 0) {
      const remainingReviews: CompletedReview[] = pendingSubmissions
        .map((sub) => {
          const action =
            (sub as ReviewSubmission & { previousAction?: ReviewActionType })?.previousAction ??
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

  const loadSubmissionForEdit = useCallback((record: ReviewHistoryRecord) => {
    const sub = toSubmission(record.candidate);
    const prevAction: ReviewActionType =
      record.vote === 1 ? 'approved' : record.vote === 2 ? 'declined' : 'reported';
    const submissionWithPrev = { ...sub, previousAction: prevAction };
    setPendingSubmissions([submissionWithPrev]);
    setTotalSubmissions(1);
    setIsRecheckingSubmission(true);
    setRecheckingReviewIndex(0);
    setRecheckingPreviousAction(prevAction);
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(false);
  }, []);

  const keepCurrentReviewAndNext = useCallback((): boolean => {
    if (pendingSubmissions.length === 0) return true;
    const current = pendingSubmissions[0];
    const prevAction =
      (current as ReviewSubmission & { previousAction?: ReviewActionType })?.previousAction ??
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
        (nextItem as ReviewSubmission & { previousAction?: ReviewActionType })?.previousAction,
      );
    }

    return completes;
  }, [pendingSubmissions, recheckingPreviousAction]);

  const finishSubmissionCheck = () => {
    setCheckedReviewIndex(0);
    setIsCheckingSubmission(false);
  };

  const resetReviewWorkflow = async () => {
    inFlightVotesRef.current.clear();
    setIsSubmittingReview(false);
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
      questClaimId?: string;
    },
  ): Promise<boolean> => {
    const submission = pendingSubmissions[0];
    if (!submission) return false;

    // Concurrency guard: avoid duplicate vote calls for the same submission
    if (inFlightVotesRef.current.has(submission.id)) {
      console.warn(
        '[ReviewWorkflow] Blocked duplicate review action in flight for:',
        submission.id,
      );
      return false;
    }
    inFlightVotesRef.current.add(submission.id);
    setIsSubmittingReview(true);

    const completedRecheckIndex = isRecheckingSubmission ? recheckingReviewIndex : undefined;

    const action: ReviewActionType =
      typeof actionOrDecision === 'string' ? actionOrDecision : actionOrDecision.action;
    const reason =
      details?.declineReason ||
      (typeof actionOrDecision === 'object' ? actionOrDecision.declineReason : undefined);
    const note =
      details?.declineNote ||
      (typeof actionOrDecision === 'object' ? actionOrDecision.declineNote : undefined);
    const suggestedSignTypeId =
      (details as any)?.suggestedSignTypeId ??
      (typeof actionOrDecision === 'object'
        ? (actionOrDecision as any).suggestedSignTypeId
        : undefined);

    const params = { candidateId: submission.id };

    try {
      // 1. Dispatch backend network call first and await response before modifying state
      if (action === 'reported_new_sign') {
        if (details?.newSignReport) {
          const proposedName =
            details.newSignReport.proposedName?.trim() || submission.title || 'Biển mới đề xuất';
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
        if (completedRecheckIndex !== undefined) {
          try {
            await undoVote({ params });
          } catch (undoErr) {
            console.warn('[ReviewWorkflow] Non-fatal undo error before recasting vote:', undoErr);
          }
        }

        // Include GPS data if available, omit if GPS is disabled or unavailable
        let gpsCoords: { latitude: number; longitude: number } | null = null;
        try {
          const freshLoc = await fetchFreshGpsLocation(2500);
          if (
            freshLoc &&
            typeof freshLoc.latitude === 'number' &&
            typeof freshLoc.longitude === 'number'
          ) {
            gpsCoords = { latitude: freshLoc.latitude, longitude: freshLoc.longitude };
          }
        } catch (e) {
          console.warn('[ReviewWorkflow] Could not obtain GPS coordinates:', e);
        }

        await castVote({
          params,
          request: {
            vote: action === 'approved' ? 1 : -1,
            ...(suggestedSignTypeId != null
              ? { suggestedSignTypeId: Number(suggestedSignTypeId) }
              : {}),
            ...(reason ? { declineReason: reason } : {}),
            ...(note ? { declineNote: note } : {}),
            ...(details?.questClaimId ? { questClaimId: details.questClaimId } : {}),
            ...(gpsCoords ? { latitude: gpsCoords.latitude, longitude: gpsCoords.longitude } : {}),
          },
        });
      }

      // 2. Only on successful API execution: update review history and advance pending queue
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
          (nextItem as ReviewSubmission & { previousAction?: ReviewActionType })?.previousAction,
        );
      }
      setSessionReviewCount((count) => count + 1);

      return true;
    } catch (err) {
      console.warn('Failed to submit review action:', err);
      return false;
    } finally {
      inFlightVotesRef.current.delete(submission.id);
      setIsSubmittingReview(false);
    }
  };

  const undoLastReview = async (): Promise<boolean> => {
    const lastReview = reviewHistory[reviewHistory.length - 1];
    if (!lastReview) return false;

    if (inFlightVotesRef.current.has(lastReview.submission.id)) {
      return false;
    }
    inFlightVotesRef.current.add(lastReview.submission.id);
    setIsSubmittingReview(true);

    setReviewHistory((history) => history.slice(0, -1));
    setPendingSubmissions((pending) => [lastReview.submission, ...pending]);
    setSessionReviewCount((count) => Math.max(0, count - 1));

    try {
      if (lastReview.action === 'approved' || lastReview.action === 'declined') {
        await undoVote({ params: { candidateId: lastReview.submission.id } });
      }
    } catch (err) {
      console.warn('Failed to undo vote:', err);
    } finally {
      inFlightVotesRef.current.delete(lastReview.submission.id);
      setIsSubmittingReview(false);
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
        ensureCandidateInQueue,
        error,
        finishSubmissionCheck,
        goToNextCheckedReview,
        goToPreviousCheckedReview,
        isLoading,
        isSubmittingReview,
        jumpToSubmissionIndex,
        jumpToSubmissionById,
        keepCurrentReviewAndNext,
        loadSubmissionForEdit,
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
