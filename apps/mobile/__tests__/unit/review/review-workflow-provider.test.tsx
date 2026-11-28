import React from 'react';
import { renderHook, act } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ReviewWorkflowProvider,
  useReviewWorkflow,
} from '@/feature/review/context/review-workflow-provider';

// Mock expo-router segments
let mockSegments: string[] = ['(authenticated)', '(tabs)', 'work', 'submission-review'];
jest.mock('expo-router', () => ({
  useSegments: () => mockSegments,
}));

// Mock session provider
let mockSession: any = {
  accessToken: 'valid-reviewer-token',
  account: { id: 'reviewer-1' },
};
jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: mockSession }),
}));

// Mock review hooks with stable references
const mockCastVote = jest.fn().mockResolvedValue({});
const mockReportCandidate = jest.fn().mockResolvedValue({});
const mockReportMissingType = jest.fn().mockResolvedValue({});
const mockSkipSign = jest.fn().mockResolvedValue({});
const mockUndoVote = jest.fn().mockResolvedValue({});
const mockGetCandidateSignDetails = jest.fn();

jest.mock('@/api/reviews/review', () => ({
  getCandidateSignDetails: (...args: any[]) => mockGetCandidateSignDetails(...args),
}));

const getMockSubmissions = () => [
  { id: 'sub-1', title: 'Biển cấm 101', latitude: 10.7, longitude: 106.7 },
  { id: 'sub-2', title: 'Biển nguy hiểm 201', latitude: 10.8, longitude: 106.8 },
  { id: 'sub-3', title: 'Biển chỉ dẫn 401', latitude: 10.9, longitude: 106.9 },
];

const mockRefetchQueue = jest.fn();
const mockRefetchHistory = jest.fn();

jest.mock('@/feature/review/hooks/use-review', () => ({
  reviewKeys: {
    all: (id: string) => ['reviews', id],
  },
  useGetReviewQueue: () => ({
    refetch: mockRefetchQueue,
  }),
  useGetReviewHistory: () => ({
    refetch: mockRefetchHistory,
  }),
  useCastVoteOnSignCandidate: () => ({
    mutateAsync: mockCastVote,
  }),
  useReportSignCandidate: () => ({
    mutateAsync: mockReportCandidate,
  }),
  useReportMissingType: () => ({
    mutateAsync: mockReportMissingType,
  }),
  useSkipSign: () => ({
    mutateAsync: mockSkipSign,
  }),
  useUndoVoteOnCandidate: () => ({
    mutateAsync: mockUndoVote,
  }),
}));

describe('ReviewWorkflowProvider and useReviewWorkflow', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    mockSegments = ['(authenticated)', '(tabs)', 'work', 'submission-review'];
    mockSession = {
      accessToken: 'valid-reviewer-token',
      account: { id: 'reviewer-1' },
    };
    mockRefetchQueue.mockResolvedValue({
      data: {
        submissions: getMockSubmissions(),
        total: 3,
      },
    });
    mockRefetchHistory.mockResolvedValue({
      data: [],
    });
  });

  const createWrapper = () => {
    const qc = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>
        <ReviewWorkflowProvider>{children}</ReviewWorkflowProvider>
      </QueryClientProvider>
    );
  };

  it('initializes workflow and loads queue when active on review screen', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.pendingSubmissions).toHaveLength(3);
    expect(result.current.totalSubmissions).toBe(3);
    expect(result.current.sessionReviewCount).toBe(0);
    expect(result.current.reviewHistory).toEqual([]);
  });

  it('completes review with approved and advances queue', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      const ok = await result.current.completeCurrentReview('approved');
      expect(ok).toBe(true);
    });

    expect(mockCastVote).toHaveBeenCalledWith({
      params: { candidateId: 'sub-1' },
      request: { vote: 1 },
    });
    expect(result.current.reviewHistory).toHaveLength(1);
    expect(result.current.reviewHistory[0].action).toBe('approved');
    expect(result.current.pendingSubmissions).toHaveLength(2);
    expect(result.current.sessionReviewCount).toBe(1);
  });

  it('completes review with declined, reason, note and suggestedSignTypeId', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      await result.current.completeCurrentReview('declined', {
        declineReason: 'WRONG_TYPE',
        declineNote: 'Sai loại biển',
        suggestedSignTypeId: 102,
      });
    });

    expect(mockCastVote).toHaveBeenCalledWith({
      params: { candidateId: 'sub-1' },
      request: {
        vote: -1,
        declineReason: 'WRONG_TYPE',
        declineNote: 'Sai loại biển',
        suggestedSignTypeId: 102,
      },
    });
  });

  it('completes review with reported and reported_new_sign', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    // 1. Report candidate
    await act(async () => {
      await result.current.completeCurrentReview('reported', {
        declineReason: 'Ảnh mờ',
      });
    });
    expect(mockReportCandidate).toHaveBeenCalledWith({
      params: { candidateId: 'sub-1' },
      request: { reason: 'Ảnh mờ' },
    });

    // 2. Report new missing sign type
    await act(async () => {
      await result.current.completeCurrentReview('reported_new_sign', {
        newSignReport: {
          proposedName: 'Biển lạ',
          description: 'Cần bổ sung',
        } as any,
      });
    });
    expect(mockReportMissingType).toHaveBeenCalledWith(
      expect.objectContaining({
        candidateId: 'sub-2',
        proposedName: 'Biển lạ',
        description: 'Cần bổ sung',
      })
    );
  });

  it('supports skipCurrentReview', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      await result.current.skipCurrentReview();
    });

    expect(mockSkipSign).toHaveBeenCalledWith({
      params: { candidateId: 'sub-1' },
    });
    expect(result.current.reviewHistory[0].action).toBe('skipped');
  });

  it('supports undoLastReview and restores previous submission', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    // First undo when history is empty returns false
    let undoOk = false;
    await act(async () => {
      undoOk = await result.current.undoLastReview();
    });
    expect(undoOk).toBe(false);

    // Vote 1 item
    await act(async () => {
      await result.current.completeCurrentReview('approved');
    });
    expect(result.current.pendingSubmissions).toHaveLength(2);

    // Undo vote
    await act(async () => {
      undoOk = await result.current.undoLastReview();
    });
    expect(undoOk).toBe(true);
    expect(mockUndoVote).toHaveBeenCalledWith({
      params: { candidateId: 'sub-1' },
    });
    expect(result.current.pendingSubmissions).toHaveLength(3);
    expect(result.current.reviewHistory).toHaveLength(0);
  });

  it('supports checked review navigation: goToPreviousCheckedReview and goToNextCheckedReview', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.completeCurrentReview('approved');
    });
    await act(async () => {
      await result.current.completeCurrentReview('approved');
    });

    expect(result.current.reviewHistory).toHaveLength(2);
    expect(result.current.checkedReviewIndex).toBe(0);

    await act(async () => {
      result.current.goToNextCheckedReview();
    });
    expect(result.current.checkedReviewIndex).toBe(1);

    await act(async () => {
      result.current.goToPreviousCheckedReview();
    });
    expect(result.current.checkedReviewIndex).toBe(0);

    await act(async () => {
      result.current.finishSubmissionCheck();
    });
    expect(result.current.isCheckingSubmission).toBe(false);
  });

  it('supports beginSubmissionCheck and cancelSubmissionCheck', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.completeCurrentReview('approved');
    });
    await act(async () => {
      await result.current.completeCurrentReview('approved');
    });

    // Recheck index 1
    await act(async () => {
      result.current.beginSubmissionCheck(1);
    });
    expect(result.current.isRecheckingSubmission).toBe(true);
    expect(result.current.recheckingReviewIndex).toBe(1);

    // Cancel recheck
    await act(async () => {
      result.current.cancelSubmissionCheck?.();
    });
    expect(result.current.isRecheckingSubmission).toBe(false);
  });

  it('supports keepCurrentReviewAndNext during recheck', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.completeCurrentReview('approved');
    });

    await act(async () => {
      result.current.beginSubmissionCheck(0);
    });

    await act(async () => {
      const completes = result.current.keepCurrentReviewAndNext?.();
      expect(completes).toBe(true);
    });
    expect(result.current.isRecheckingSubmission).toBe(false);
  });

  it('supports jumpToSubmissionIndex and resetReviewWorkflow', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    await act(async () => {
      result.current.jumpToSubmissionIndex?.(2);
    });
    expect(result.current.pendingSubmissions).toHaveLength(1);
    expect(result.current.pendingSubmissions[0].id).toBe('sub-3');

    // Reset workflow
    await act(async () => {
      await result.current.resetReviewWorkflow();
    });
    expect(result.current.reviewHistory).toEqual([]);
    expect(result.current.sessionReviewCount).toBe(0);
  });

  it('supports reviewCheckedSubmissionAgain', async () => {
    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });
    await act(async () => {
      await result.current.completeCurrentReview('approved');
    });

    let recheckResult = false;
    await act(async () => {
      recheckResult = await result.current.reviewCheckedSubmissionAgain();
    });
    expect(recheckResult).toBe(true);
    expect(result.current.isRecheckingSubmission).toBe(true);
  });

  it('fetches claimed candidate via ensureCandidateInQueue when missing from queue and forwards questClaimId on vote', async () => {
    mockGetCandidateSignDetails.mockResolvedValue({
      candidate: {
        id: 'cand-claimed-99',
        submissionId: 'sub-99',
        status: 'PENDING_REVIEW',
        createdAt: '2026-11-25T10:00:00Z',
        predictedSignType: {
          id: 12,
          signCode: 'P.102',
          nameVi: 'Cấm đi ngược chiều',
          nameEn: 'No Entry',
        },
      },
      locationContext: {
        coordinates: { latitude: 10.77, longitude: 106.7 },
        displayLocation: 'Đường Nguyễn Huệ, Quận 1',
      },
    });

    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.refresh();
    });

    let found = false;
    await act(async () => {
      found = (await result.current.ensureCandidateInQueue?.('cand-claimed-99')) ?? false;
    });

    expect(found).toBe(true);
    expect(mockGetCandidateSignDetails).toHaveBeenCalledWith(
      { candidateId: 'cand-claimed-99' },
      'valid-reviewer-token',
    );
    expect(result.current.pendingSubmissions[0].id).toBe('cand-claimed-99');

    await act(async () => {
      await result.current.completeCurrentReview('approved', {
        questClaimId: 'claim-cand-99',
      });
    });

    expect(mockCastVote).toHaveBeenCalledWith({
      params: { candidateId: 'cand-claimed-99' },
      request: {
        vote: 1,
        questClaimId: 'claim-cand-99',
      },
    });
  });

  it('preserves injected claimed candidate if queue refetch resolves afterward and resets load state when leaving screen', async () => {
    let resolveQueue!: (val: any) => void;
    mockRefetchQueue.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveQueue = resolve;
        }),
    );

    mockGetCandidateSignDetails.mockResolvedValue({
      candidate: {
        id: 'cand-injected-1',
        submissionId: 'sub-inj-1',
        status: 'PENDING_REVIEW',
        createdAt: '2026-11-25T10:00:00Z',
        predictedSignType: {
          id: 12,
          signCode: 'P.102',
          nameVi: 'Cấm đi ngược chiều',
          nameEn: 'No Entry',
        },
      },
    });

    const { result } = await renderHook(() => useReviewWorkflow(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.ensureCandidateInQueue?.('cand-injected-1');
    });

    expect(result.current.pendingSubmissions[0]?.id).toBe('cand-injected-1');

    await act(async () => {
      resolveQueue({ data: { submissions: [], total: 0 } });
    });

    expect(result.current.pendingSubmissions[0]?.id).toBe('cand-injected-1');
    expect(result.current.queueLoadVersion).toBeGreaterThanOrEqual(1);
  });
});
