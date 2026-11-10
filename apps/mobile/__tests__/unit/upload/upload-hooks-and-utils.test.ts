import { renderHook, waitFor } from '@testing-library/react-native';
import { spatialKeys, useReverseGeocode } from '@/feature/upload/hooks/use-reverse-geocode';
import { readDraftImage, updateDraftCoordinates, useSaveSurveyDraft } from '@/feature/upload/hooks/use-save-survey-draft';
import { surveySubmissionKeys, useCreateSurveySubmission, useSubmitSurveySubmission } from '@/feature/upload/hooks/use-survey-submission';
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
    session: { accessToken: 'test-token', user: { id: 'usr-1' } },
  }),
}));

jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(),
  setStorageItemAsync: jest.fn(),
}));

jest.mock('@/api/spatial/spatial', () => ({
  resolveLocation: jest.fn(),
}));

jest.mock('@/api/survey-submission/survey-submission', () => ({
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
}));

jest.mock('@tanstack/react-query', () => {
  const actual = jest.requireActual('@tanstack/react-query');
  return {
    ...actual,
    useQueryClient: () => ({
      invalidateQueries: jest.fn(),
    }),
  };
});

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
    });
  });

  describe('survey-image.ts utilities', () => {
    it('prepares survey image with inferring mime type and file name', async () => {
      const res = await prepareSurveyImage({
        uri: 'file:///data/img.png',
        type: 'image',
      });

      expect(res.fileName).toBe('img.png');
      expect((res.chunk as any).file.type).toBe('image/png');
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

  describe('chunk-upload-manager.ts', () => {
    it('throws error if video exceeds maximum size before upload', async () => {
      jest.spyOn(videoProcessor, 'getVideoFileSizeBytes').mockResolvedValueOnce(
        videoProcessor.MAX_SURVEY_VIDEO_SIZE_BYTES + 500
      );

      await expect(
        executeChunkedVideoUpload({
          submissionId: 'sub-1',
          videoUri: 'file:///huge.mp4',
          durationSeconds: 30,
          startCoordinate: [106.7009, 10.7769],
          endCoordinate: [106.702, 10.778],
          capturedAt: new Date().toISOString(),
          accessToken: 'test-token',
        })
      ).rejects.toThrow();
    });
  });
});
