import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react-native';

const mockUseSegments = jest.fn(() => ['work', 'submission-review']);
jest.mock('expo-router', () => ({
  useSegments: () => mockUseSegments(),
}));

let mockSessionData: any = { session: { accessToken: 'tok-rev', account: { id: 'rev-1' } } };
jest.mock('@/context/session-provider', () => ({
  useSession: () => mockSessionData,
}));

const mockRefetchQueue = jest.fn();
const mockRefetchHistory = jest.fn();
const mockCastVote = jest.fn();
const mockReportCandidate = jest.fn();
const mockReportMissingType = jest.fn();
const mockSkipSign = jest.fn();
const mockUndoVote = jest.fn();

jest.mock('@/feature/review/hooks/use-review', () => ({
  reviewKeys: { all: (id?: string) => ['review', id] },
  useGetReviewQueue: () => ({ refetch: mockRefetchQueue }),
  useGetReviewHistory: () => ({ refetch: mockRefetchHistory }),
  useCastVoteOnSignCandidate: () => ({ mutateAsync: mockCastVote }),
  useReportSignCandidate: () => ({ mutateAsync: mockReportCandidate }),
  useReportMissingType: () => ({ mutateAsync: mockReportMissingType }),
  useSkipSign: () => ({ mutateAsync: mockSkipSign }),
  useUndoVoteOnCandidate: () => ({ mutateAsync: mockUndoVote }),
}));

const mockFetchFreshGpsLocation = jest.fn();
jest.mock('@/feature/navigation/utils/gps', () => ({
  fetchFreshGpsLocation: (...args: any[]) => mockFetchFreshGpsLocation(...args),
}));

import {
  ReviewWorkflowProvider,
  useReviewWorkflow,
} from '@/feature/review/context/review-workflow-provider';

const sampleSub1: any = {
  id: 'sub-1',
  title: 'Cấm rẽ trái',
  location: 'Q1',
  coordinate: [106.7, 10.7],
  status: 'PENDING',
};
const sampleSub2: any = {
  id: 'sub-2',
  title: 'Giới hạn tốc độ',
  location: 'Q3',
  coordinate: [106.71, 10.71],
  status: 'PENDING',
};

describe('ReviewWorkflowProvider Branch Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSegments.mockReturnValue(['work', 'submission-review']);
    mockSessionData = { session: { accessToken: 'tok-rev', account: { id: 'rev-1' } } };
    mockFetchFreshGpsLocation.mockResolvedValue({ latitude: 10.77, longitude: 106.7 });
    mockCastVote.mockResolvedValue({ ok: true });
    mockReportCandidate.mockResolvedValue({ ok: true });
    mockReportMissingType.mockResolvedValue({ ok: true });
    mockSkipSign.mockResolvedValue({ ok: true });
    mockUndoVote.mockResolvedValue({ ok: true });
    mockRefetchQueue.mockResolvedValue({
      data: { submissions: [sampleSub1, sampleSub2], total: 2 },
    });
    mockRefetchHistory.mockResolvedValue({ data: [] });
  });

  const makeWrapper = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>
        <ReviewWorkflowProvider>{children}</ReviewWorkflowProvider>
      </QueryClientProvider>
    );
  };

  it('throws when useReviewWorkflow is called outside ReviewWorkflowProvider', async () => {
    await expect(renderHook(() => useReviewWorkflow())).rejects.toThrow();
  });

  it('covers load failure, refresh, jumpToSubmissionIndex, jumpToSubmissionById, and edit/cancel/keep paths', async () => {
    mockRefetchQueue.mockRejectedValueOnce(new Error('Queue load failed'));
    const wrapper = makeWrapper();
    const { result } = await renderHook(() => useReviewWorkflow(), { wrapper });

    await waitFor(() => expect(result.current.error).toBe('Queue load failed'));

    mockRefetchQueue.mockResolvedValueOnce({
      data: { submissions: [sampleSub1, sampleSub2], total: 2 },
    });
    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.pendingSubmissions).toHaveLength(2);

    // Jump by id before slicing removes sub-1, then jump to index
    await act(async () => {
      result.current.jumpToSubmissionById?.('');
      result.current.jumpToSubmissionById?.('sub-1'); // already first
      result.current.jumpToSubmissionById?.('sub-2'); // moves sub-2 to front
    });
    expect(result.current.pendingSubmissions[0]?.id).toBe('sub-2');

    await act(async () => {
      result.current.jumpToSubmissionById?.('sub-1'); // moves sub-1 back to front
    });
    expect(result.current.pendingSubmissions[0]?.id).toBe('sub-1');

    await act(async () => {
      result.current.jumpToSubmissionIndex?.(1);
    });
    expect(result.current.pendingSubmissions[0]?.id).toBe('sub-2');

    await act(async () => {
      await result.current.refresh();
    });
    expect(result.current.pendingSubmissions[0]?.id).toBe('sub-1');

    // Approve, report_new_sign, report, skip, undo, recheck, cancel, keep
    await act(async () => {
      const ok = await result.current.completeCurrentReview('approved');
      expect(ok).toBe(true);
    });
    expect(mockCastVote).toHaveBeenCalledWith(
      expect.objectContaining({
        request: expect.objectContaining({ vote: 1, latitude: 10.77, longitude: 106.7 }),
      }),
    );

    await act(async () => {
      await result.current.undoLastReview();
    });
    expect(mockUndoVote).toHaveBeenCalled();

    // Reported new sign
    await act(async () => {
      await result.current.completeCurrentReview('reported_new_sign', {
        newSignReport: { proposedName: '', signCode: 'NEW.1' } as any,
      });
    });
    expect(mockReportMissingType).toHaveBeenCalled();

    // Reported candidate + GPS failure fallback
    mockFetchFreshGpsLocation.mockRejectedValueOnce(new Error('GPS disabled'));
    await act(async () => {
      await result.current.completeCurrentReview('reported', { declineReason: 'Blurry' });
    });
    expect(mockReportCandidate).toHaveBeenCalled();

    // Begin recheck from index 0, check navigation helpers, keep, cancel
    await act(async () => {
      result.current.beginSubmissionCheck(0);
    });
    expect(result.current.isRecheckingSubmission).toBe(true);

    await act(async () => {
      result.current.goToNextCheckedReview();
      result.current.goToPreviousCheckedReview();
      result.current.keepCurrentReviewAndNext?.();
    });

    await act(async () => {
      result.current.cancelSubmissionCheck?.();
      result.current.finishSubmissionCheck();
    });
    expect(result.current.isCheckingSubmission).toBe(false);

    // Load submission for edit from history record
    await act(async () => {
      result.current.loadSubmissionForEdit?.({
        id: 'hist-1',
        vote: 2,
        candidate: { id: 'cand-hist', status: 'VOTED', mediaFiles: [] },
      } as any);
    });
    expect(result.current.pendingSubmissions).toHaveLength(1);

    // Undo error path + skip + reset
    await act(async () => {
      await result.current.skipCurrentReview();
    });
    expect(mockSkipSign).toHaveBeenCalled();

    await act(async () => {
      await result.current.resetReviewWorkflow();
    });
    expect(result.current.reviewHistory).toEqual([]);
  });

  it('handles completeCurrentReview failure and re-casting with undo failure cleanly', async () => {
    const wrapper = makeWrapper();
    const { result } = await renderHook(() => useReviewWorkflow(), { wrapper });
    await waitFor(() => expect(result.current.pendingSubmissions).toHaveLength(2));

    // Complete item 0 so history has 1 entry
    await act(async () => {
      await result.current.completeCurrentReview('declined', {
        declineReason: 'Wrong sign',
        suggestedSignTypeId: '15',
      });
    });

    // Jump back into history entry -> enters recheck mode
    await act(async () => {
      result.current.jumpToSubmissionById?.('sub-1');
    });
    // Simulate undo failure non-fatal + castVote failure
    mockUndoVote.mockRejectedValueOnce(new Error('undo err'));
    mockCastVote.mockRejectedValueOnce(new Error('vote err'));
    await act(async () => {
      const ok = await result.current.completeCurrentReview('approved');
      expect(ok).toBe(false);
    });

    // Review checked submission again returns false if out of range
    await act(async () => {
      result.current.beginSubmissionCheck();
      await result.current.reviewCheckedSubmissionAgain();
    });
  });
});
