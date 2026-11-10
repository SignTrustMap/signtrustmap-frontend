import {
  registerZeroCopyDraft,
  releaseZeroCopyDraft,
  startSmartPollingSync,
  handleBackgroundSilentPush,
  reconcilePendingCrops,
} from '@/feature/upload/utils/crop-sync-manager';
import { getStorageItemAsync, setStorageItemAsync } from '@/hooks/use-storage';
import { getSurveySubmissionStatus } from '@/api/survey-submission/survey-submission';
import { batchCropCandidateSigns } from '@/feature/upload/utils/high-res-cropper';

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(),
  setStorageItemAsync: jest.fn(),
}));

jest.mock('@/api/survey-submission/survey-submission', () => ({
  getSurveySubmissionStatus: jest.fn(),
}));

jest.mock('@/feature/upload/utils/high-res-cropper', () => ({
  batchCropCandidateSigns: jest.fn(),
}));

describe('crop-sync-manager', () => {
  let fakeStorage: Record<string, string>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();

    fakeStorage = {};
    (getStorageItemAsync as jest.Mock).mockImplementation((key: string) => {
      return Promise.resolve(fakeStorage[key] || null);
    });
    (setStorageItemAsync as jest.Mock).mockImplementation((key: string, val: string) => {
      fakeStorage[key] = val;
      return Promise.resolve();
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('registerZeroCopyDraft & releaseZeroCopyDraft', () => {
    it('registers a new zero-copy record and persists to storage', async () => {
      await registerZeroCopyDraft('sub-1', 'file:///test/video.mp4', 'asset-1');

      expect(setStorageItemAsync).toHaveBeenCalledWith(
        'stm_zero_copy_submissions_index',
        expect.stringContaining('sub-1')
      );

      const saved = JSON.parse(fakeStorage['stm_zero_copy_submissions_index']);
      expect(saved['sub-1']).toMatchObject({
        submissionId: 'sub-1',
        videoUri: 'file:///test/video.mp4',
        assetId: 'asset-1',
        status: 'PENDING_DETECTION',
      });
      expect(typeof saved['sub-1'].createdAt).toBe('number');
    });

    it('releases zero-copy draft by deleting it from records', async () => {
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-1': { submissionId: 'sub-1', videoUri: 'v.mp4', createdAt: Date.now() },
        'sub-2': { submissionId: 'sub-2', videoUri: 'v2.mp4', createdAt: Date.now() },
      });

      await releaseZeroCopyDraft('sub-1');

      const saved = JSON.parse(fakeStorage['stm_zero_copy_submissions_index']);
      expect(saved['sub-1']).toBeUndefined();
      expect(saved['sub-2']).toBeDefined();
    });

    it('gracefully handles missing or invalid storage JSON', async () => {
      (getStorageItemAsync as jest.Mock).mockRejectedValueOnce(new Error('Storage failure'));

      // Should not throw
      await registerZeroCopyDraft('sub-err', 'v.mp4');
      const saved = JSON.parse(fakeStorage['stm_zero_copy_submissions_index']);
      expect(saved['sub-err']).toBeDefined();
    });
  });

  describe('startSmartPollingSync', () => {
    it('polls status endpoint and triggers cropping when candidates are found', async () => {
      const candidates = [{ signId: 's1', box: [0, 0, 100, 100], timestampMs: 1200 }];
      (getSurveySubmissionStatus as jest.Mock)
        .mockResolvedValueOnce({ candidates: [] })
        .mockResolvedValueOnce({ candidates });
      (batchCropCandidateSigns as jest.Mock).mockResolvedValue([{ uri: 'crop1.jpg' }]);

      const onComplete = jest.fn();
      const cancel = startSmartPollingSync('sub-1', 'v.mp4', 'token-123', onComplete);

      // Advance 4s -> attempt 1 (empty candidates)
      await jest.advanceTimersByTimeAsync(4000);
      expect(getSurveySubmissionStatus).toHaveBeenCalledTimes(1);
      expect(batchCropCandidateSigns).not.toHaveBeenCalled();

      // Advance 4s -> attempt 2 (found candidate)
      await jest.advanceTimersByTimeAsync(4000);
      expect(getSurveySubmissionStatus).toHaveBeenCalledTimes(2);
      expect(batchCropCandidateSigns).toHaveBeenCalledWith(candidates, 'v.mp4');
      expect(onComplete).toHaveBeenCalledWith(1);

      cancel();
    });

    it('stops polling when cancelled via return function', async () => {
      const cancel = startSmartPollingSync('sub-1', 'v.mp4', 'token-123');
      cancel();

      await jest.advanceTimersByTimeAsync(8000);
      expect(getSurveySubmissionStatus).not.toHaveBeenCalled();
    });

    it('stops polling when max attempts (30) reached', async () => {
      (getSurveySubmissionStatus as jest.Mock).mockResolvedValue({ candidates: [] });

      startSmartPollingSync('sub-1', 'v.mp4', 'token-123');

      await jest.advanceTimersByTimeAsync(31 * 4000);
      expect(getSurveySubmissionStatus).toHaveBeenCalledTimes(30);
    });

    it('ignores intermittent network glitch during polling', async () => {
      (getSurveySubmissionStatus as jest.Mock)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ candidates: [{ signId: 's1' }] });

      const onComplete = jest.fn();
      startSmartPollingSync('sub-1', 'v.mp4', 'token-123', onComplete);

      await jest.advanceTimersByTimeAsync(4000);
      await jest.advanceTimersByTimeAsync(4000);

      expect(onComplete).toHaveBeenCalledWith(1);
    });
  });

  describe('handleBackgroundSilentPush', () => {
    it('returns success when record does not exist in local index', async () => {
      const res = await handleBackgroundSilentPush({ submissionId: 'non-existent' });
      expect(res).toEqual({ processedCount: 0, success: true });
    });

    it('processes push with candidates provided directly in payload', async () => {
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-1': { submissionId: 'sub-1', videoUri: 'v.mp4', createdAt: Date.now() },
      });
      (batchCropCandidateSigns as jest.Mock).mockResolvedValue([{ uri: 'c1.jpg' }, { uri: 'c2.jpg' }]);

      const res = await handleBackgroundSilentPush({
        submissionId: 'sub-1',
        candidates: [{ signId: 's1' } as any, { signId: 's2' } as any],
      });

      expect(res).toEqual({ processedCount: 2, success: true });
      expect(batchCropCandidateSigns).toHaveBeenCalled();
      const saved = JSON.parse(fakeStorage['stm_zero_copy_submissions_index']);
      expect(saved['sub-1']).toBeUndefined();
    });

    it('fetches candidates via status API when not in push payload', async () => {
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-1': { submissionId: 'sub-1', videoUri: 'v.mp4', createdAt: Date.now() },
      });
      (getSurveySubmissionStatus as jest.Mock).mockResolvedValue({
        candidates: [{ signId: 's1' }],
      });
      (batchCropCandidateSigns as jest.Mock).mockResolvedValue([{ uri: 'c1.jpg' }]);

      const res = await handleBackgroundSilentPush({
        submissionId: 'sub-1',
        accessToken: 'token-abc',
      });

      expect(res).toEqual({ processedCount: 1, success: true });
      expect(getSurveySubmissionStatus).toHaveBeenCalledWith('sub-1', 'token-abc');
    });

    it('fails when candidates missing and accessToken is omitted', async () => {
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-1': { submissionId: 'sub-1', videoUri: 'v.mp4', createdAt: Date.now() },
      });

      const res = await handleBackgroundSilentPush({
        submissionId: 'sub-1',
      });

      expect(res).toEqual({ processedCount: 0, success: false });
    });

    it('handles unexpected exceptions and returns failure', async () => {
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-1': { submissionId: 'sub-1', videoUri: 'v.mp4', createdAt: Date.now() },
      });
      (batchCropCandidateSigns as jest.Mock).mockRejectedValue(new Error('Cropper crashed'));

      const res = await handleBackgroundSilentPush({
        submissionId: 'sub-1',
        candidates: [{ signId: 's1' } as any],
      });

      expect(res).toEqual({ processedCount: 0, success: false });
    });
  });

  describe('reconcilePendingCrops', () => {
    it('expires records older than 48 hours without calling status API', async () => {
      const expiredTime = Date.now() - 50 * 60 * 60 * 1000;
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-old': { submissionId: 'sub-old', videoUri: 'v.mp4', createdAt: expiredTime },
      });

      await reconcilePendingCrops('token-abc');

      expect(getSurveySubmissionStatus).not.toHaveBeenCalled();
      const saved = JSON.parse(fakeStorage['stm_zero_copy_submissions_index']);
      expect(saved['sub-old']).toBeUndefined();
    });

    it('queries status for fresh records and crops when candidates exist', async () => {
      const recentTime = Date.now() - 1000;
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-recent': { submissionId: 'sub-recent', videoUri: 'v.mp4', createdAt: recentTime },
      });
      (getSurveySubmissionStatus as jest.Mock).mockResolvedValue({
        candidates: [{ signId: 's1' }],
      });
      (batchCropCandidateSigns as jest.Mock).mockResolvedValue([{ uri: 'c1.jpg' }]);

      await reconcilePendingCrops('token-abc');

      expect(getSurveySubmissionStatus).toHaveBeenCalledWith('sub-recent', 'token-abc');
      expect(batchCropCandidateSigns).toHaveBeenCalled();
      const saved = JSON.parse(fakeStorage['stm_zero_copy_submissions_index']);
      expect(saved['sub-recent']).toBeUndefined();
    });

    it('silently ignores errors for individual records or storage failure', async () => {
      const recentTime = Date.now() - 1000;
      fakeStorage['stm_zero_copy_submissions_index'] = JSON.stringify({
        'sub-err': { submissionId: 'sub-err', videoUri: 'v.mp4', createdAt: recentTime },
      });
      (getSurveySubmissionStatus as jest.Mock).mockRejectedValue(new Error('Server error'));

      await expect(reconcilePendingCrops('token-abc')).resolves.not.toThrow();
    });
  });
});
