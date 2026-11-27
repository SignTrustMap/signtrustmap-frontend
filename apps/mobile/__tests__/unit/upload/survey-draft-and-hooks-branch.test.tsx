import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';

let mockSessionObj: any = { session: { accessToken: 'tok-surv', account: { id: 'acc-1' } } };
jest.mock('@/context/session-provider', () => ({
  useSession: () => mockSessionObj,
}));

const mockStorage = new Map<string, string>();
jest.mock('@/hooks/use-storage', () => ({
  getStorageItemAsync: jest.fn(async (k: string) => mockStorage.get(k) ?? null),
  setStorageItemAsync: jest.fn(async (k: string, v: string) => {
    mockStorage.set(k, v);
  }),
}));

const mockPrepareSurveyImage = jest.fn();
const mockPrepareSurveyGpx = jest.fn();
jest.mock('@/feature/upload/utils/survey-image', () => ({
  prepareSurveyImage: (...args: any[]) => mockPrepareSurveyImage(...args),
  prepareSurveyGpx: (...args: any[]) => mockPrepareSurveyGpx(...args),
}));

jest.mock('@/api/survey-submission/survey-submission', () => ({
  completeSurveyUpload: jest.fn(),
  createMockSubmissionStatus: jest.fn((id: string) => ({ submission: { id, status: 'PENDING_CORRECTION' } })),
  createSurveySubmission: jest.fn(),
  updateSurveySubmission: jest.fn(),
  submitSurveySubmission: jest.fn(),
  getMyPendingSubmissions: jest.fn(),
  getMySubmissions: jest.fn(),
  getMySurveyStats: jest.fn(),
  getSurveySubmissionStatus: jest.fn(),
  getSurveyUploadSession: jest.fn(),
  initializeSurveyUpload: jest.fn(),
  isUuid: jest.fn((v?: string) => Boolean(v && v.length === 36)),
  uploadSurveyChunk: jest.fn(),
}));

import * as surveyApi from '@/api/survey-submission/survey-submission';

import {
  readDraftImage,
  updateDraftCoordinates,
  useSaveSurveyDraft,
} from '@/feature/upload/hooks/use-save-survey-draft';
import {
  useCreateSurveySubmission,
  useResubmitFalseNegativeMutation,
  useSubmitSurveySubmission,
  useUpdateSurveySubmission,
} from '@/feature/upload/hooks/use-survey-submission';

describe('useSaveSurveyDraft & useSurveySubmission Branch Coverage', () => {
  const validUuid = '123e4567-e89b-12d3-a456-426614174000';

  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage.clear();
    mockSessionObj = { session: { accessToken: 'tok-surv', account: { id: 'acc-1' } } };
    mockPrepareSurveyImage.mockResolvedValue({
      fileName: 'snap.jpg',
      sizeBytes: 2048,
      chunk: { chunkIndex: 0, file: { uri: 'file:///snap.jpg' } },
    });
    mockPrepareSurveyGpx.mockResolvedValue({
      fileName: 'track.gpx',
      sizeBytes: 512,
      chunk: { chunkIndex: 0, file: { uri: 'file:///track.gpx' } },
    });
    (surveyApi.createSurveySubmission as jest.Mock).mockResolvedValue({ id: validUuid });
    (surveyApi.initializeSurveyUpload as jest.Mock).mockResolvedValue({ sessionId: 'sess-1' });
    (surveyApi.uploadSurveyChunk as jest.Mock).mockResolvedValue({ uploaded: true });
    (surveyApi.completeSurveyUpload as jest.Mock).mockResolvedValue({ complete: true });
    (surveyApi.updateSurveySubmission as jest.Mock).mockResolvedValue({ id: validUuid });
    (surveyApi.submitSurveySubmission as jest.Mock).mockResolvedValue({ submissionId: validUuid, status: 'SUBMITTED' });
  });

  const makeWrapper = () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={qc}>{children}</QueryClientProvider>
    );
  };

  it('covers readDraftImage, updateDraftCoordinates, new draft image+gpx upload, and video retry draft recovery', async () => {
    mockStorage.set('survey-draft-acc-1-bad', '{invalid');
    expect(await readDraftImage('acc-1', 'bad')).toBeUndefined();
    expect(await updateDraftCoordinates('acc-1', 'missing', { latitude: 10 })).toBeUndefined();

    const { result, rerender } = await renderHook(() => useSaveSurveyDraft(), { wrapper: makeWrapper() });

    // Save brand-new image draft + GPX
    await act(async () => {
      await result.current(
        { uri: 'file:///snap.jpg', type: 'image' },
        {
          submissionType: 'SINGLE_IMAGE',
          latitude: 10.77,
          longitude: 106.7,
          capturedAt: '2026-01-01T00:00:00Z',
          coordinateSource: 'IMAGE_EXIF',
        },
        undefined,
        { uri: 'file:///track.gpx', name: 'track.gpx' },
      );
    });
    expect(surveyApi.createSurveySubmission).toHaveBeenCalled();
    expect(surveyApi.initializeSurveyUpload).toHaveBeenCalledTimes(2);
    expect(surveyApi.completeSurveyUpload).toHaveBeenCalledTimes(2);

    const updated = await updateDraftCoordinates('acc-1', validUuid, { latitude: 10.8, longitude: 106.8 });
    expect(updated?.startLat).toBe(10.8);

    // Existing submissionId with video skips image single-chunk upload and restores saved draft
    await act(async () => {
      await result.current(
        { uri: 'file:///clip.mp4', type: 'video', startLat: 10.75, startLon: 106.75 },
        {
          submissionType: 'VIDEO_GPX',
          capturedAt: '2026-01-01T00:00:00Z',
          coordinateSource: 'IMAGE_EXIF',
        },
        validUuid,
      );
    });

    // Requires session
    mockSessionObj = { session: null };
    await rerender({});
    await expect(
      result.current(
        { uri: 'file:///a.jpg' },
        {
          submissionType: 'SINGLE_IMAGE',
          capturedAt: '2026-01-01T00:00:00Z',
          coordinateSource: 'IMAGE_EXIF',
        },
      ),
    ).rejects.toThrow();
  });

  it('covers survey-submission mutations auth guards & useResubmitFalseNegativeMutation', async () => {
    const wrapper = makeWrapper();
    const { result, rerender } = await renderHook(
      () => ({
        create: useCreateSurveySubmission(),
        update: useUpdateSurveySubmission(),
        submit: useSubmitSurveySubmission(),
        resubmit: useResubmitFalseNegativeMutation(),
      }),
      { wrapper },
    );

    const baseCreate = {
      submissionType: 'SINGLE_IMAGE' as const,
      capturedAt: '2026-01-01T00:00:00Z',
      coordinateSource: 'IMAGE_EXIF' as const,
    };

    await act(async () => {
      await result.current.create.mutateAsync({ request: baseCreate });
      await result.current.update.mutateAsync({ submissionId: validUuid, request: { note: 'ok' } });
      await result.current.submit.mutateAsync({ submissionId: validUuid });

      // Non-UUID resubmit returns mock success
      const mockRes: any = await result.current.resubmit.mutateAsync({
        submissionId: 'non-uuid',
        boxes: [{ id: 'b1', x: 10, y: 10, width: 50, height: 50, signCode: 'P.102', signName: 'Cấm' }],
        imageDimensions: { width: 0, height: 0 },
      });
      expect(mockRes.status).toBe('SUBMITTED');

      // Real UUID resubmit calls PATCH + POST submit
      await result.current.resubmit.mutateAsync({
        submissionId: validUuid,
        boxes: [{ id: 'b2', x: 10, y: 10, width: 50, height: 50 }],
        imageDimensions: { width: 400, height: 400 },
        note: 'Có biển báo rõ',
      });
    });
    expect(surveyApi.updateSurveySubmission).toHaveBeenCalledTimes(2);
    expect(surveyApi.submitSurveySubmission).toHaveBeenCalledTimes(2);

    mockSessionObj = { session: null };
    await rerender({});
    await expect(
      result.current.create.mutateAsync({ request: baseCreate }),
    ).rejects.toThrow();
    await expect(
      result.current.update.mutateAsync({ submissionId: validUuid, request: {} }),
    ).rejects.toThrow();
    await expect(
      result.current.submit.mutateAsync({ submissionId: validUuid }),
    ).rejects.toThrow();
  });
});
