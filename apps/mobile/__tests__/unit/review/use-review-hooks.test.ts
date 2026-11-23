import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  reviewKeys,
  useGetReviewQueue,
  useGetMyReviewHistory,
  useGetCandidateSignDetails,
  useCastVoteOnSignCandidate,
  useReportSignCandidate,
  useReportMissingType,
  useSkipSign,
  useUndoVoteOnCandidate,
  useGetReviewHistory,
  useGetMyRawReviewHistory,
  useGetCatalog,
  useRefreshCatalog,
  useGetMyReviewerStats,
} from '@/feature/review/hooks/use-review';
import * as reviewApi from '@/api/reviews/review';
import * as catalogApi from '@/api/reviews/catalog';

let mockSession: any = {
  accessToken: 'test-token',
  account: { id: 'reviewer-acc-1' },
};

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({ session: mockSession }),
}));

describe('use-review hooks suite', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSession = {
      accessToken: 'test-token',
      account: { id: 'reviewer-acc-1' },
    };
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    React.createElement(QueryClientProvider, { client: queryClient }, children)
  );

  it('builds standard review query keys', () => {
    expect(reviewKeys.all('acc-1')).toEqual(['reviews', 'acc-1']);
    expect(reviewKeys.queue('acc-1', { page: '1', pageSize: '10' })).toEqual(['reviews', 'acc-1', 'queue', { page: '1', pageSize: '10' }]);
    expect(reviewKeys.candidate('acc-1', 'cand-1')).toEqual(['reviews', 'acc-1', 'candidate', 'cand-1']);
    expect(reviewKeys.stats('acc-1')).toEqual(['reviewer-stats', 'acc-1']);
  });

  it('fetches review queue and candidate sign details', async () => {
    jest.spyOn(reviewApi, 'getReviewQueue').mockResolvedValueOnce({
      items: [],
      total: 0,
      page: 1,
      pageSize: 10,
      totalPages: 1,
    } as any);

    const { result } = await renderHook(() => useGetReviewQueue(), { wrapper });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    jest.spyOn(reviewApi, 'getCandidateSignDetails').mockResolvedValueOnce({
      id: 'cand-123',
    } as any);

    const { result: detailsRes } = await renderHook(
      () => useGetCandidateSignDetails({ candidateId: 'cand-123' }),
      { wrapper },
    );
    await waitFor(() => expect(detailsRes.current.isSuccess).toBe(true));
  });

  it('executes review mutations: vote, report, skip, undo', async () => {
    jest.spyOn(reviewApi, 'castVoteOnSignCandidate').mockResolvedValueOnce({ success: true } as any);
    jest.spyOn(reviewApi, 'reportSignCandidate').mockResolvedValueOnce({ success: true } as any);
    jest.spyOn(reviewApi, 'reportMissingType').mockResolvedValueOnce({ success: true } as any);
    jest.spyOn(reviewApi, 'skipSign').mockResolvedValueOnce({ success: true } as any);
    jest.spyOn(reviewApi, 'undoVoteOnCandidate').mockResolvedValueOnce({ success: true } as any);

    const { result: voteRes } = await renderHook(() => useCastVoteOnSignCandidate(), { wrapper });
    await voteRes.current.mutateAsync({
      params: { candidateId: 'cand-1' },
      request: { vote: 1 },
    });

    const { result: reportRes } = await renderHook(() => useReportSignCandidate(), { wrapper });
    await reportRes.current.mutateAsync({
      params: { candidateId: 'cand-1' },
      request: { reason: 'BLURRY_IMAGE' },
    });

    const { result: missingRes } = await renderHook(() => useReportMissingType(), { wrapper });
    await missingRes.current.mutateAsync({
      nameVi: 'Biển lạ',
      category: 'WARNING',
    } as any);

    const { result: skipRes } = await renderHook(() => useSkipSign(), { wrapper });
    await skipRes.current.mutateAsync({
      params: { candidateId: 'cand-1' },
    });

    const { result: undoRes } = await renderHook(() => useUndoVoteOnCandidate(), { wrapper });
    await undoRes.current.mutateAsync({
      params: { candidateId: 'cand-1' },
    });
  });

  it('fetches review history, stats, and catalog', async () => {
    jest.spyOn(reviewApi, 'getMyReviewHistory').mockResolvedValueOnce({ items: [], total: 0 } as any);
    const { result: histRes } = await renderHook(() => useGetReviewHistory(), { wrapper });
    await waitFor(() => expect(histRes.current.isSuccess).toBe(true));

    jest.spyOn(reviewApi, 'getMyReviewHistory').mockResolvedValueOnce({ items: [], total: 0 } as any);
    const { result: rawHistRes } = await renderHook(() => useGetMyRawReviewHistory(), { wrapper });
    await waitFor(() => expect(rawHistRes.current.isSuccess).toBe(true));

    jest.spyOn(reviewApi, 'getMyReviewHistory').mockResolvedValueOnce({ items: [], total: 0 } as any);
    const { result: myHistRes } = await renderHook(() => useGetMyReviewHistory({ page: '1', pageSize: '10' }), { wrapper });
    await waitFor(() => expect(myHistRes.current.isSuccess).toBe(true));

    jest.spyOn(catalogApi, 'getCatalog').mockResolvedValueOnce({ signs: [] } as any);
    const { result: catRes } = await renderHook(() => useGetCatalog(), { wrapper });
    await waitFor(() => expect(catRes.current.isSuccess).toBe(true));

    jest.spyOn(catalogApi, 'getCatalog').mockResolvedValueOnce({ signs: [{ id: 1 }] } as any);
    const { result: refCatRes } = await renderHook(() => useRefreshCatalog(), { wrapper });
    await refCatRes.current.mutateAsync();

    jest.spyOn(reviewApi, 'getMyReviewerStats').mockResolvedValueOnce({
      totalReviews: 10,
      approvalRate: 0.95,
      streak: 5,
    } as any);
    const { result: statsRes } = await renderHook(() => useGetMyReviewerStats(), { wrapper });
    await waitFor(() => expect(statsRes.current.isSuccess).toBe(true));
  });

  it('throws error when mutation executed without session', async () => {
    mockSession = null;
    const { result: voteRes } = await renderHook(() => useCastVoteOnSignCandidate(), { wrapper });
    await expect(
      voteRes.current.mutateAsync({
        params: { candidateId: 'cand-1' },
        request: { vote: 1 },
      }),
    ).rejects.toThrow();

    const { result: missingRes } = await renderHook(() => useReportMissingType(), { wrapper });
    await expect(
      missingRes.current.mutateAsync({ nameVi: 'Biển lạ' } as any),
    ).rejects.toThrow();

    const { result: refCatRes } = await renderHook(() => useRefreshCatalog(), { wrapper });
    await expect(refCatRes.current.mutateAsync()).rejects.toThrow();
  });
});
