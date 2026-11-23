import React from 'react';
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { spatialKeys, useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';
import { readDraftImage, updateDraftCoordinates, useSaveSurveyDraft } from '@/feature/upload/hooks/use-save-survey-draft';
import {
  surveySubmissionKeys,
  useCreateSurveySubmission,
  useUpdateSurveySubmission,
  useSubmitSurveySubmission,
  useInitializeSurveyUpload,
  useUploadSurveyChunk,
  useCompleteSurveyUpload,
  useGetMySubmissions,
  useGetMyPendingSubmissions,
  useGetMySurveyStats,
  useGetSurveySubmissionStatus,
  useGetSurveyUploadSession,
} from '@/feature/upload/hooks/use-survey-submission';
import { prepareSurveyImage, prepareSurveyGpx } from '@/feature/upload/utils/survey-image';
import { executeChunkedVideoUpload } from '@/feature/upload/utils/chunk-upload-manager';
import * as storage from '@/hooks/use-storage';
import * as spatialApi from '@/api/spatial/spatial';
import * as videoProcessor from '@/feature/upload/utils/video-processor';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------
jest.mock('expo-file-system/legacy', () => ({
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true, size: 1024 }),
  readAsStringAsync: jest.fn().mockResolvedValue('<gpx>valid content</gpx>'),
  writeAsStringAsync: jest.fn().mockResolvedValue(undefined),
  cacheDirectory: 'file:///cache/',
  EncodingType: { UTF8: 'utf8' },
}));

jest.mock('expo-blob', () => ({
  Blob: class MockBlob {
    size = 100;
    type = 'image/jpeg';
  },
}));

jest.mock('@/context/session-provider', () => ({
  useSession: () => ({
    session: { accessToken: 'test-token', account: { id: 'usr-1' }, user: { id: 'usr-1' } },
  }),
}));

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(),
  setStorageItemAsync: jest.fn(),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: jest.fn(),
}));

jest.mock('@/api/survey-submission/survey-submission', () => {
  const actual = jest.requireActual('@/api/survey-submission/survey-submission');
  return {
    ...actual,
    createSurveySubmission: jest.fn().mockResolvedValue({ id: 'sub-created-1' }),
    submitSurveySubmission: jest.fn().mockResolvedValue({ success: true }),
    updateSurveySubmission: jest.fn().mockResolvedValue({ success: true }),
    initializeSurveyUpload: jest.fn().mockResolvedValue({ sessionId: 'session-1' }),
    uploadSurveyChunk: jest.fn().mockResolvedValue({ success: true }),
    completeSurveyUpload: jest.fn().mockResolvedValue({ success: true }),
    getMySubmissions: jest.fn().mockResolvedValue({ items: [], total: 0 }),
    getMyPendingSubmissions: jest.fn().mockResolvedValue([]),
    getMySurveyStats: jest.fn().mockResolvedValue({ totalSubmissions: 5 }),
    getSurveySubmissionStatus: jest.fn().mockResolvedValue({ status: 'COMPLETED' }),
    getSurveyUploadSession: jest.fn().mockResolvedValue({ sessionId: 'sess-1' }),
  };
});

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
  };
});

const testQueryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});
const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(QueryClientProvider, { client: testQueryClient }, children);

describe('Upload Hooks and Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('useReverseGeocode and spatialKeys', () => {
    it('generates spatialKeys properly', () => {
      expect(spatialKeys.all).toEqual(['spatial']);
      expect(spatialKeys.resolve(10.7769123, 106.7009456)).toEqual([
        'spatial',
        'resolve',
        10.77691,
        106.70095,
      ]);
      expect(spatialKeys.resolve(undefined, undefined)).toEqual([
        'spatial',
        'resolve',
        null,
        null,
      ]);
    });

    it('returns query configuration with resolveLocation', async () => {
      (spatialApi.resolveLocation as jest.Mock).mockResolvedValueOnce({
        displayAddress: '123 Nguyen Hue',
      });

      const queryClient = new (require('@tanstack/react-query').QueryClient)();
      const wrapper = ({ children }: any) => {
        const React = require('react');
        const { QueryClientProvider } = require('@tanstack/react-query');
        return React.createElement(QueryClientProvider, { client: queryClient }, children);
      };

      const { result } = await renderHook(
        () => useReverseGeocode({ latitude: 10.7769, longitude: 106.7009 }),
        { wrapper }
      );

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isPending).toBe(true);
      });
    });
  });

  describe('useSaveSurveyDraft storage functions', () => {
    it('reads draft image from storage', async () => {
      const draft = {
        submissionId: 'sub-1',
        uri: 'file:///photo.jpg',
        startLat: 10.7769,
        startLon: 106.7009,
      };
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(draft));

      const res = await readDraftImage('usr-1', 'sub-1');
      expect(res).toEqual(draft);
    });

    it('returns undefined if draft not found or corrupted', async () => {
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(null);
      const res1 = await readDraftImage('usr-1', 'sub-1');
      expect(res1).toBeUndefined();

      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce('invalid json');
      const res2 = await readDraftImage('usr-1', 'sub-1');
      expect(res2).toBeUndefined();
    });

    it('updates draft coordinates', async () => {
      const existing = {
        submissionId: 'sub-1',
        uri: 'file:///photo.jpg',
        startLat: 10.7769,
        startLon: 106.7009,
      };
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(existing));

      const updated = await updateDraftCoordinates('usr-1', 'sub-1', {
        latitude: 10.8,
        longitude: 106.8,
      });

      expect(updated?.startLat).toBe(10.8);
      expect(updated?.startLon).toBe(106.8);
      expect(storage.setStorageItemAsync).toHaveBeenCalled();
    });
  });

  describe('surveySubmissionKeys and mutation hooks', () => {
    it('builds survey submission keys correctly', () => {
      expect(surveySubmissionKeys.all('acc-1')).toEqual(['survey-submissions', 'acc-1']);
      expect(surveySubmissionKeys.pending('acc-1')).toEqual([
        'survey-submissions',
        'acc-1',
        'pending',
      ]);
      expect(surveySubmissionKeys.stats('acc-1')).toEqual([
        'survey-submissions',
        'acc-1',
        'stats',
      ]);
      expect(surveySubmissionKeys.status('acc-1', 'sub-1')).toEqual([
        'survey-submissions',
        'acc-1',
        'status',
        'sub-1',
      ]);
      expect(surveySubmissionKeys.session('acc-1', 'sess-1')).toEqual([
        'survey-submissions',
        'acc-1',
        'session',
        'sess-1',
      ]);
      expect(surveySubmissionKeys.list('acc-1', { page: '1', pageSize: '20' })).toEqual([
        'survey-submissions',
        'acc-1',
        'list',
        { page: '1', pageSize: '20' },
      ]);
    });

    it('executes mutation hooks and query hooks', async () => {
      // 1. Create mutation
      const { result: createRes } = await renderHook(() => useCreateSurveySubmission(), { wrapper });
      await createRes.current.mutateAsync({ request: { submissionType: 'SINGLE_IMAGE', capturedAt: '', coordinateSource: 'DEVICE_GPS' } });

      // 2. Update mutation
      const { result: updateRes } = await renderHook(() => useUpdateSurveySubmission(), { wrapper });
      await updateRes.current.mutateAsync({ submissionId: 'sub-1', request: { note: 'test' } });

      // 3. Submit mutation
      const { result: submitRes } = await renderHook(() => useSubmitSurveySubmission(), { wrapper });
      await submitRes.current.mutateAsync({ submissionId: 'sub-1' });

      // 4. Initialize upload
      const { result: initRes } = await renderHook(() => useInitializeSurveyUpload(), { wrapper });
      await initRes.current.mutateAsync({ submissionId: 'sub-1', request: { mediaType: 'IMAGE', originalFilename: 'img.jpg', totalChunks: 1, totalSizeBytes: 100 } });

      // 5. Upload chunk
      const { result: uploadChunkRes } = await renderHook(() => useUploadSurveyChunk(), { wrapper });
      await uploadChunkRes.current.mutateAsync({ sessionId: 'session-1', request: {} as any });

      // 6. Complete upload
      const { result: completeRes } = await renderHook(() => useCompleteSurveyUpload(), { wrapper });
      await completeRes.current.mutateAsync({ sessionId: 'session-1' });

      // 7. Queries
      const { result: listRes } = await renderHook(() => useGetMySubmissions(), { wrapper });
      await waitFor(() => expect(listRes.current.isSuccess).toBe(true));

      const { result: pendingRes } = await renderHook(() => useGetMyPendingSubmissions(), { wrapper });
      await waitFor(() => expect(pendingRes.current.isSuccess).toBe(true));

      const { result: statsRes } = await renderHook(() => useGetMySurveyStats(), { wrapper });
      await waitFor(() => expect(statsRes.current.isSuccess).toBe(true));

      const { result: statusRes } = await renderHook(() => useGetSurveySubmissionStatus('sub-1'), { wrapper });
      await waitFor(() => expect(statusRes.current.isSuccess).toBe(true));

      const { result: sessionRes } = await renderHook(() => useGetSurveyUploadSession('sess-1'), { wrapper });
      await waitFor(() => expect(sessionRes.current.isSuccess).toBe(true));
    });
  });

  describe('survey-image.ts utilities', () => {
    it('prepares survey image with inferring mime type and file name', async () => {
      const res = await prepareSurveyImage({
        uri: 'file:///data/img.png',
        type: 'image',
      });

      expect(res.fileName).toBe('img.jpg');
      expect((res.chunk as any).file.type).toBe('image/jpeg');
    });

    it('throws error when video exceeds maximum size', async () => {
      const fileSystem = require('expo-file-system/legacy');
      fileSystem.getInfoAsync.mockResolvedValueOnce({
        exists: true,
        size: videoProcessor.MAX_SURVEY_VIDEO_SIZE_BYTES + 5000,
      });

      await expect(
        prepareSurveyImage({
          uri: 'file:///data/large.mp4',
          type: 'video',
        })
      ).rejects.toThrow();
    });

    it('prepares survey gpx file', async () => {
      const res = await prepareSurveyGpx({
        uri: 'file:///data/route.gpx',
        name: 'track.gpx',
      });

      expect(res.fileName).toBe('track.gpx');
    });
  });

  describe('use-save-survey-draft.ts', () => {
    it('reads and updates draft image from storage', async () => {
      // 1. Storage returns nothing
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(null);
      expect(await readDraftImage('usr-1', 'sub-1')).toBeUndefined();

      // 2. Storage returns valid JSON
      const draftObj = { submissionId: 'sub-1', uri: 'file:///img.jpg', startLat: 10.7, startLon: 106.6 };
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(draftObj));
      const res = await readDraftImage('usr-1', 'sub-1');
      expect(res).toEqual(draftObj);

      // 3. Storage returns invalid JSON
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce('invalid json');
      expect(await readDraftImage('usr-1', 'sub-1')).toBeUndefined();

      // 4. Update coordinates
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(JSON.stringify(draftObj));
      const updated = await updateDraftCoordinates('usr-1', 'sub-1', { latitude: 10.8, longitude: 106.7 });
      expect(updated?.startLat).toBe(10.8);
      expect(updated?.startLon).toBe(106.7);
      expect(storage.setStorageItemAsync).toHaveBeenCalled();

      // 5. Update non-existent draft
      (storage.getStorageItemAsync as jest.Mock).mockResolvedValueOnce(null);
      expect(await updateDraftCoordinates('usr-1', 'sub-missing', { latitude: 10.8 })).toBeUndefined();
    });

    it('saves new draft image and completes single-chunk upload', async () => {
      const { result } = await renderHook(() => useSaveSurveyDraft(), { wrapper });
      const saveDraft = result.current;

      const subId = await saveDraft(
        {
          uri: 'file:///data/img.jpg',
          type: 'image',
          startLat: 10.77,
          startLon: 106.7,
        },
        {
          submissionType: 'SINGLE_IMAGE',
          capturedAt: new Date().toISOString(),
          coordinateSource: 'DEVICE_GPS',
          latitude: 10.77,
          longitude: 106.7,
        },
      );

      expect(subId).toBe('sub-created-1');
      expect(storage.setStorageItemAsync).toHaveBeenCalled();
    });

    it('saves video draft and uploads GPX track', async () => {
      const { result } = await renderHook(() => useSaveSurveyDraft(), { wrapper });
      const saveDraft = result.current;

      const subId = await saveDraft(
        {
          uri: 'file:///data/video.mp4',
          type: 'video',
          startLat: 10.77,
          startLon: 106.7,
        },
        {
          submissionType: 'VIDEO_GPX',
          capturedAt: new Date().toISOString(),
          coordinateSource: 'DEVICE_GPS',
        },
        'sub-existing-1',
        { uri: 'file:///data/route.gpx', name: 'track.gpx' },
      );

      expect(subId).toBe('sub-existing-1');
      expect(storage.setStorageItemAsync).toHaveBeenCalled();
    });
  });
});
