import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  castVoteOnSignCandidate, getCandidateSignDetails, getMyReviewHistory, getReviewQueue,
  reportSignCandidate, undoVoteOnCandidate, skipSign, getMyReviewerStats
} from '@/api/reviews/review';
import { getCatalog } from '@/api/reviews/catalog';
import { useSession } from '@/context/session-provider';
import { selectReviewHistory, selectReviewQueue } from '@/api/reviews/review-workflow';
import type {
  CandidateReportParams, CandidateSignDetailsParams, CandidateVoteParams,
  CannotIdentifySignReportParams, MyReviewHistoryParams, ReportDto, ReviewQueueParams, VoteDto,
  ReviewerStatsResponse,
} from '@/types/reviewsType';

export const reviewKeys = {
  all: (accountId: string | undefined) => ['reviews', accountId] as const,
  queue: (accountId: string | undefined, params: ReviewQueueParams) => [...reviewKeys.all(accountId), 'queue', params] as const,
  history: (accountId: string | undefined, params: MyReviewHistoryParams) => [...reviewKeys.all(accountId), 'history', params] as const,
  candidate: (accountId: string | undefined, candidateId: string | undefined) => [...reviewKeys.all(accountId), 'candidate', candidateId] as const,
  catalog: (accountId: string | undefined) => ['review-catalog', accountId] as const,
  stats: (accountId: string | undefined) => ['reviewer-stats', accountId] as const,
};

export function useGetReviewQueue(params: ReviewQueueParams = { page: '1', pageSize: '100' }, enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: reviewKeys.queue(session?.account.id, params),
    queryFn: session ? ({ signal }) => getReviewQueue(params, session.accessToken, signal) : skipToken,
    select: selectReviewQueue,
    enabled,
  });
}

export function useGetMyReviewHistory(params: MyReviewHistoryParams, enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: reviewKeys.history(session?.account.id, params),
    queryFn: session ? ({ signal }) => getMyReviewHistory(params, session.accessToken, signal) : skipToken,
    enabled,
  });
}

// Candidate details remain untyped until their response contract is confirmed.
export function useGetCandidateSignDetails(params: CandidateSignDetailsParams | undefined, enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: reviewKeys.candidate(session?.account.id, params?.candidateId),
    queryFn: session && params?.candidateId
      ? ({ signal }) => getCandidateSignDetails(params, session.accessToken, signal) : skipToken,
    enabled,
  });
}

function useReviewMutation<TVariables extends { params: CandidateVoteParams }>(
  mutation: (variables: TVariables, accessToken: string) => Promise<unknown>,
) {
  const { session } = useSession();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => {
      if (!session) throw new Error('Sign in to review submissions.');
      return mutation(variables, session.accessToken);
    },
    onSuccess: () => {
      // Invalidate review lists and also refresh the reviewer credit score / stats
      queryClient.invalidateQueries({ queryKey: reviewKeys.all(session?.account.id) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.stats(session?.account.id) });
    },
  });
}

export function useCastVoteOnSignCandidate() {
  return useReviewMutation(({ params, request, signal }: { params: CandidateVoteParams; request: VoteDto; signal?: AbortSignal }, token) =>
    castVoteOnSignCandidate(params, request, token, signal));
}


export function useReportSignCandidate() {
  return useReviewMutation(({ params, request, signal }: { params: CandidateReportParams; request: ReportDto; signal?: AbortSignal }, token) =>
    reportSignCandidate(params, request, token, signal));
}

export function useSkipSign() {
  return useReviewMutation(({ params, signal }: { params: CannotIdentifySignReportParams; signal?: AbortSignal }, token) =>
    skipSign(params, token, signal));
}

export function useUndoVoteOnCandidate() {
  return useReviewMutation(({ params, signal }: { params: CandidateVoteParams; signal?: AbortSignal }, token) =>
    undoVoteOnCandidate(params, token, signal));
}

/** Load unfiltered history in the shape consumed by the review workflow. */
export function useGetReviewHistory(enabled = true) {
  const { session } = useSession();
  const params: MyReviewHistoryParams = { page: '1', pageSize: '100' };
  return useQuery({
    queryKey: reviewKeys.history(session?.account.id, params),
    queryFn: session ? ({ signal }) => getMyReviewHistory(params, session.accessToken, signal) : skipToken,
    select: selectReviewHistory,
    enabled,
  });
}

export function useGetCatalog(enabled = true) {
  const { session } = useSession();
  return useQuery({
    queryKey: reviewKeys.catalog(session?.account.id),
    queryFn: session ? ({ signal }) => getCatalog(session.accessToken, signal) : skipToken,
    enabled,
  });
}

/**
 * Fetches the reviewer's credit score (reliability_score), accuracy rate,
 * streak, and vote totals. Automatically refreshed after each vote mutation.
 */
export function useGetMyReviewerStats(enabled = true) {
  const { session } = useSession();
  return useQuery<ReviewerStatsResponse>({
    queryKey: reviewKeys.stats(session?.account.id),
    queryFn: session
      ? ({ signal }) => getMyReviewerStats(session.accessToken, signal)
      : skipToken,
    enabled,
    staleTime: 30_000, // treat as fresh for 30 s to avoid redundant fetches during a review session
  });
}
