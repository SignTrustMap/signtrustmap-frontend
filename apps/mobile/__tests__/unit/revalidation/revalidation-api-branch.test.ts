import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';

jest.mock('expo-file-system/legacy', () => ({
  EncodingType: { Base64: 'base64', UTF8: 'utf8' },
  FileSystemUploadType: { MULTIPART: 1 },
  readAsStringAsync: jest.fn(),
  uploadAsync: jest.fn(),
}));

const mockApiRequest = jest.fn();

jest.mock('@/api/api-client', () => {
  class MockApiError extends Error {
    status: number;
    body?: unknown;
    constructor(message: string, status: number, body?: unknown) {
      super(message);
      this.status = status;
      this.body = body;
    }
  }
  return {
    apiBaseUrl: () => 'https://api.signmap.site/api/v1',
    apiRequest: (...args: any[]) => mockApiRequest(...args),
    ApiError: MockApiError,
  };
});

const mockGetStorage = jest.fn();
jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: (...args: any[]) => mockGetStorage(...args),
}));

const mockCompress = jest.fn();
jest.mock('@/feature/upload/utils/survey-image', () => ({
  compressAndResizeSurveyImage: (...args: any[]) => mockCompress(...args),
}));

import {
  buildEvidenceFormData,
  buildEvidenceParameters,
  getStoredAccessToken,
  prepareUploadEvidenceMedia,
  resolveEvidenceType,
  uriToBlob,
} from '@/api/revalidation/revalidation.media';
import {
  checkInRevalidationTask,
  earlyClassifyRevalidationTask,
  fetchFirstRevalidationSign,
  finalizeRevalidationTask,
  getAllRevalidationTasks,
  getCheckInEligibility,
  getEvidenceDecisions,
  getRevalidationEvidenceQueue,
  getRevalidationTask,
  getRevalidationTasks,
  getRevalidationTasksInBounds,
  getSignEvidences,
  getTaskEvidences,
  requestEvidenceRecapture,
  submitRevalidationEvidence,
} from '@/api/revalidation/revalidation';

describe('Revalidation API & Media Branch Coverage', () => {
  const origPlatform = Platform.OS;
  const origFetch = globalThis.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(Platform, 'OS', { value: 'android', configurable: true });
    mockGetStorage.mockResolvedValue(JSON.stringify({ accessToken: 'stored-tok' }));
  });

  afterEach(() => {
    Object.defineProperty(Platform, 'OS', { value: origPlatform, configurable: true });
    globalThis.fetch = origFetch;
  });

  describe('revalidation.media.ts', () => {
    it('covers getStoredAccessToken, resolveEvidenceType, prepareUploadEvidenceMedia, and buildEvidenceParameters', async () => {
      mockGetStorage.mockResolvedValueOnce(null);
      expect(await getStoredAccessToken()).toBeUndefined();
      mockGetStorage.mockResolvedValueOnce('{bad-json');
      expect(await getStoredAccessToken()).toBeUndefined();
      mockGetStorage.mockResolvedValueOnce(JSON.stringify({ accessToken: 't1' }));
      expect(await getStoredAccessToken()).toBe('t1');

      expect(resolveEvidenceType({ latitude: 1, longitude: 1, evidenceType: 'CHANGED' } as any)).toBe('CHANGED');
      expect(resolveEvidenceType({ latitude: 1, longitude: 1, condition: 'MISSING' } as any)).toBe('REMOVED');
      expect(resolveEvidenceType({ latitude: 1, longitude: 1, condition: 'REPLACED' } as any)).toBe('CHANGED');
      expect(resolveEvidenceType({ latitude: 1, longitude: 1 } as any)).toBe('STILL_ACTIVE');

      // Remote & video bypass compression
      expect(await prepareUploadEvidenceMedia({ uri: 'https://cdn/a.jpg' })).toEqual({ uri: 'https://cdn/a.jpg' });
      expect(await prepareUploadEvidenceMedia({ uri: 'file:///v.mp4', mimeType: 'video/mp4' })).toMatchObject({ uri: 'file:///v.mp4' });

      mockCompress.mockResolvedValueOnce({ uri: 'file:///comp.jpg' });
      const resPng = await prepareUploadEvidenceMedia({ uri: 'file:///raw.png', fileName: 'photo.png' });
      expect(resPng?.fileName).toBe('photo.jpg');

      mockCompress.mockResolvedValueOnce({ uri: 'file:///comp2.jpg' });
      expect((await prepareUploadEvidenceMedia({ uri: 'file:///raw.jpeg' }))?.fileName).toBe('evidence.jpg');

      mockCompress.mockRejectedValueOnce(new Error('Compress err'));
      expect(await prepareUploadEvidenceMedia({ uri: 'file:///fallback.jpg' })).toEqual({ uri: 'file:///fallback.jpg' });

      const params = buildEvidenceParameters(
        {
          latitude: 10.77,
          longitude: 106.7,
          accuracyMeters: 12.34,
          capturedAt: 'invalid-date',
          confirmedSignId: 'sig-1',
          headingDegrees: 185.6,
          isLiveCapture: true,
          suggestedSignTypeId: 42.4,
          mediaUrl: 'https://cdn/ev.jpg',
        } as any,
        'CHANGED',
      );
      expect(params.capturedAt).toBe('invalid-date');
      expect(params.headingDegrees).toBe('186');
      expect(params.suggestedSignTypeId).toBe('42');
      expect(params.isLiveCapture).toBe('true');
    });

    it('covers uriToBlob fetch + FileSystem base64 fallback & buildEvidenceFormData branches', async () => {
      globalThis.fetch = jest
        .fn()
        .mockResolvedValueOnce({ blob: async () => new Blob(['abc'], { type: 'text/plain' }) })
        .mockRejectedValueOnce(new Error('Fetch unsupported'));
      const b1 = await uriToBlob('file:///a.jpg');
      expect(b1.type).toBe('image/jpeg');

      (FileSystem.readAsStringAsync as jest.Mock).mockResolvedValueOnce(Buffer.from('hello').toString('base64'));
      const b2 = await uriToBlob('file:///b.jpg', 'image/png');
      expect(b2.type).toBe('image/png');

      globalThis.fetch = jest.fn().mockResolvedValue({ blob: async () => new Blob(['x'], { type: 'image/jpeg' }) });
      const fdHttp = await buildEvidenceFormData(
        { latitude: 10, longitude: 106, capturedAt: '2026-01-01T00:00:00Z' } as any,
        'STILL_ACTIVE',
        { uri: 'https://cdn/x.jpg' },
      );
      expect(fdHttp).toBeDefined();

      const fdBlob = await buildEvidenceFormData(
        { latitude: 10, longitude: 106 } as any,
        'REMOVED',
        { uri: 'data:image/jpeg;base64,AA==' },
      );
      expect(fdBlob).toBeDefined();

      // Native uriToBlob fails inside buildEvidenceFormData -> object descriptor fallback
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('no fetch'));
      (FileSystem.readAsStringAsync as jest.Mock).mockRejectedValueOnce(new Error('fs err'));
      const fdFallback = await buildEvidenceFormData(
        { latitude: 10, longitude: 106, mediaUrl: 'https://cdn/fallback.jpg' } as any,
        'STILL_ACTIVE',
        { uri: 'file:///local.jpg' },
      );
      expect(fdFallback).toBeDefined();

      const fdUrlOnly = await buildEvidenceFormData(
        { latitude: 10, longitude: 106, mediaUrl: 'https://cdn/only.jpg' } as any,
        'STILL_ACTIVE',
      );
      expect(fdUrlOnly).toBeDefined();
    });
  });

  describe('revalidation.ts', () => {
    it('covers getRevalidationTasksInBounds, getAllRevalidationTasks fallbacks, and fetchFirstRevalidationSign', async () => {
      const ctrl = new AbortController();
      ctrl.abort();
      mockApiRequest.mockRejectedValueOnce(new Error('canceled'));
      expect(
        await getRevalidationTasksInBounds(
          { minLat: 10, minLon: 106, maxLat: 11, maxLon: 107, status: 'OPEN', priority: 'HIGH' },
          ctrl.signal,
        ),
      ).toEqual([]);

      // First two getAllRevalidationTasks calls fail/empty -> third hits nationwide bounds
      mockApiRequest
        .mockRejectedValueOnce(new Error('endpoint 1 fail'))
        .mockResolvedValueOnce({ items: [] })
        .mockResolvedValueOnce({
          items: [{ id: 't1', latitude: 10.77, longitude: 106.7, signCode: 'P.102', nameVi: 'Cấm' }],
        });
      const allTasks = await getAllRevalidationTasks({ status: 'OPEN', priority: 'HIGH', pageSize: 20 });
      expect(allTasks).toHaveLength(1);

      // All fail
      mockApiRequest.mockRejectedValue(new Error('down'));
      expect(await getAllRevalidationTasks()).toEqual([]);

      // fetchFirstRevalidationSign nearby hit, then broad hit, then empty
      mockApiRequest.mockResolvedValueOnce({
        items: [{ id: 'near-1', latitude: 10.77, longitude: 106.7, signCode: 'W.201' }],
      });
      expect((await fetchFirstRevalidationSign([106.7, 10.77]))?.id).toBeDefined();

      mockApiRequest
        .mockResolvedValueOnce({ items: [] })
        .mockResolvedValueOnce({ items: [{ id: 'broad-1', latitude: 10.8, longitude: 106.8 }] });
      expect(await fetchFirstRevalidationSign([106.7, 10.77])).toBeTruthy();

      mockApiRequest.mockRejectedValue(new Error('fail'));
      expect(await fetchFirstRevalidationSign()).toBeNull();
    });

    it('covers submitRevalidationEvidence native uploadAsync, HTTP error, fallback to apiRequest, and invalid taskId', async () => {
      await expect(
        submitRevalidationEvidence('sign-target', { latitude: 10, longitude: 106 } as any),
      ).rejects.toThrow(/không hợp lệ/);

      mockCompress.mockResolvedValue({ uri: 'file:///evidence.jpg' });

      // Native uploadAsync 200 OK
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 201,
        body: JSON.stringify({ id: 'ev-1', status: 'SUBMITTED' }),
      });
      const ok = await submitRevalidationEvidence(
        'task-1',
        { latitude: 10.77, longitude: 106.7 } as any,
        { uri: 'file:///photo.jpg', fileName: 'p.jpg' },
      );
      expect(ok).toBeDefined();

      // Native uploadAsync HTTP 400 array message throws ApiError without fallback
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 400,
        body: JSON.stringify({ message: ['err A', 'err B'] }),
      });
      await expect(
        submitRevalidationEvidence(
          'task-1',
          { latitude: 10.77, longitude: 106.7 } as any,
          { uri: 'file:///photo.jpg' },
        ),
      ).rejects.toThrow('err A, err B');

      // Non-ApiError in uploadAsync falls back to fetch FormData
      (FileSystem.uploadAsync as jest.Mock).mockRejectedValueOnce(new Error('Native module err'));
      globalThis.fetch = jest.fn().mockResolvedValue({ blob: async () => new Blob(['x'], { type: 'image/jpeg' }) });
      mockApiRequest.mockResolvedValueOnce({ id: 'ev-fallback', status: 'SUBMITTED' });
      const fb = await submitRevalidationEvidence(
        'task-1',
        { latitude: 10.77, longitude: 106.7 } as any,
        { uri: 'file:///photo.jpg' },
      );
      expect(fb).toBeDefined();
    });

    it('covers queue, tasks, task detail, evidences, decisions, finalize, check-in, recapture, and earlyClassify', async () => {
      mockApiRequest.mockResolvedValueOnce({
        items: [{
          evidenceId: 'ev1',
          verifiedSign: { signCropUrl: 'crops/s.jpg' },
          evidence: { mediaUrl: 'ev/m.jpg' },
        }],
        total: 1,
      });
      const q = await getRevalidationEvidenceQueue({ page: 1, pageSize: 10 });
      expect(q.items).toHaveLength(1);
      mockApiRequest.mockRejectedValueOnce(new Error('q err'));
      expect((await getRevalidationEvidenceQueue()).items).toEqual([]);

      mockApiRequest.mockResolvedValueOnce([{ id: 'e1' }]);
      expect(await getTaskEvidences('t1')).toHaveLength(1);
      mockApiRequest.mockRejectedValueOnce(new Error('te err'));
      expect(await getTaskEvidences('t1')).toEqual([]);

      mockApiRequest.mockResolvedValueOnce([{ id: 's1' }]);
      expect(await getSignEvidences('s1')).toHaveLength(1);
      mockApiRequest.mockRejectedValueOnce(new Error('se err'));
      expect(await getSignEvidences('s1')).toEqual([]);

      mockApiRequest.mockResolvedValueOnce({ items: [{ id: 't1' }], total: 1 });
      expect((await getRevalidationTasks({ page: 1, pageSize: 10, status: 'OPEN', sort: 'nearest', lat: 10, lon: 106, radiusMeters: 500 })).items).toHaveLength(1);
      mockApiRequest.mockRejectedValueOnce(new Error('ts err'));
      expect((await getRevalidationTasks()).items).toEqual([]);

      mockApiRequest.mockResolvedValueOnce({
        id: 't1',
        location: { lat: 10.77, lon: 106.7 },
        sign_crop_url: 'crop.jpg',
        evidences: [{ id: 'e1', suggested_sign_type_id: '42' }, { id: 'e2', suggestedSignTypeId: 7 }],
      });
      expect((await getRevalidationTask('t1'))?.evidences).toHaveLength(2);
      mockApiRequest.mockResolvedValueOnce(null);
      expect(await getRevalidationTask('t1')).toBeNull();
      mockApiRequest.mockRejectedValueOnce(new Error('dt err'));
      expect(await getRevalidationTask('t1')).toBeNull();

      mockApiRequest.mockResolvedValueOnce([{ decision: 'STILL_ACTIVE' }]);
      expect(await getEvidenceDecisions('ev1')).toHaveLength(1);
      mockApiRequest.mockRejectedValueOnce(new Error('dec err'));
      expect(await getEvidenceDecisions('ev1')).toEqual([]);

      mockApiRequest.mockClear();
      mockApiRequest.mockResolvedValue({ ok: true });
      await finalizeRevalidationTask('t1');
      await checkInRevalidationTask('t1', { latitude: 10, longitude: 106 });
      await getCheckInEligibility('t1', 10, 106, 15);
      await requestEvidenceRecapture('ev1', { reason: 'BLURRY' });
      await earlyClassifyRevalidationTask('t1', 'https://cdn/a.jpg');
      expect(mockApiRequest).toHaveBeenCalledTimes(5);
    });
  });
});
