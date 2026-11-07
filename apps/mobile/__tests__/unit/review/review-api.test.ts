import {
  getMyReviewHistory,
  getCandidateSignDetails,
  reportSignCandidate,
  reportCannotIdentifySign,
  skipSign,
  castVoteOnSignCandidate,
  undoVoteOnCandidate,
  getReviewQueue,
  getMyReviewerStats,
  reportMissingType,
  getMyRecaptures,
  submitCandidateRecapture,
} from '@/api/reviews/review';
import * as apiClient from '@/api/api-client';

jest.mock('@/api/api-client', () => ({
  apiRequest: jest.fn(),
  jsonApiRequest: jest.fn(),
}));

describe('Review API Module', () => {
  const mockToken = 'reviewer-bearer-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getMyReviewHistory', () => {
    it('queries /reviews/me/history with serialized query params', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ items: [], total: 0 });

      await getMyReviewHistory(
        { page: '1', pageSize: '20', status: 'APPROVED', search: 'P.102', surveyorId: 'surv-1' },
        mockToken,
      );

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        expect.stringMatching(/\/reviews\/me\/history\?page=1&pageSize=20&status=APPROVED&search=P\.102&surveyorId=surv-1/),
        { signal: undefined },
        mockToken,
      );
    });
  });

  describe('getCandidateSignDetails', () => {
    it('fetches candidate details by candidateId', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ id: 'cand 123' });

      const res = await getCandidateSignDetails({ candidateId: 'cand 123' }, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/reviews/candidates/cand%20123',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual({ id: 'cand 123' });
    });
  });

  describe('reportSignCandidate', () => {
    it('posts report payload for candidate', async () => {
      const reportDto = { reason: 'BLURRY_IMAGE', notes: 'Khong the nhan dien' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      await reportSignCandidate({ candidateId: 'cand-1' }, reportDto as any, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/reviews/candidates/cand-1/report',
        reportDto,
        mockToken,
        undefined,
      );
    });
  });

  describe('reportCannotIdentifySign & skipSign', () => {
    it('calls POST can-not-identify endpoint', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      await reportCannotIdentifySign({ candidateId: 'cand-1' }, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/reviews/candidates/cand-1/can-not-identify',
        { method: 'POST', signal: undefined },
        mockToken,
      );
    });

    it('calls POST skip endpoint', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      await skipSign({ candidateId: 'cand-2' }, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/reviews/candidates/cand-2/skip',
        { method: 'POST', signal: undefined },
        mockToken,
      );
    });
  });

  describe('castVoteOnSignCandidate & undoVoteOnCandidate', () => {
    it('posts vote for candidate sign', async () => {
      const voteDto = { vote: 1, confidenceScore: 0.95 };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      await castVoteOnSignCandidate({ candidateId: 'cand-1' }, voteDto as any, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/reviews/cand-1/vote',
        voteDto,
        mockToken,
        undefined,
      );
    });

    it('sends DELETE vote to undo vote on candidate', async () => {
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      await undoVoteOnCandidate({ candidateId: 'cand-1' }, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/reviews/cand-1/vote',
        {},
        mockToken,
        undefined,
        'DELETE',
      );
    });
  });

  describe('getReviewQueue', () => {
    it('calls GET /reviews/queue with pagination', async () => {
      const mockQueue = { items: [], total: 0 };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(mockQueue);

      const res = await getReviewQueue({ page: '1', pageSize: '50' }, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/reviews/queue?page=1&pageSize=50',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(mockQueue);
    });
  });

  describe('getMyReviewerStats', () => {
    it('fetches reviewer statistics', async () => {
      const stats = { totalReviewed: 150, accuracyRate: 98.5 };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(stats);

      const res = await getMyReviewerStats(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/reviews/me/stats',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(stats);
    });
  });

  describe('reportMissingType', () => {
    it('posts missing sign type proposal', async () => {
      const dto = { nameVi: 'Biển báo mới', description: 'Mô tả biển' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 1 });

      await reportMissingType(dto as any, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/reviews/missing-type',
        dto,
        mockToken,
        undefined,
      );
    });
  });

  describe('getMyRecaptures & submitCandidateRecapture', () => {
    it('fetches surveyor recaptures', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ items: [], total: 0 });

      await getMyRecaptures({ page: 1, pageSize: 10 }, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/reviews/me/recaptures?page=1&pageSize=10',
        { signal: undefined },
        mockToken,
      );
    });

    it('submits recapture with multipart FormData', async () => {
      const formData = new FormData();
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      const res = await submitCandidateRecapture('cand-10', formData, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/reviews/candidates/cand-10/recapture',
        expect.objectContaining({
          method: 'POST',
          body: formData,
        }),
        mockToken,
      );
      expect(res.success).toBe(true);
    });
  });
});
