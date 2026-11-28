import { executeChunkedVideoUpload } from '@/feature/upload/utils/chunk-upload-manager';
import {
  completeSurveyUpload,
  getSurveyUploadSession,
  initializeSurveyUpload,
  uploadSurveyChunk,
} from '@/api/survey-submission/survey-submission';
import {
  calculateTemporalChunks,
  getVideoFileSizeBytes,
  prepareVideoChunk,
  MAX_SURVEY_VIDEO_SIZE_BYTES,
} from '@/feature/upload/utils/video-processor';
import { prepareSurveyGpx } from '@/feature/upload/utils/survey-image';
import { createCompanionGpxDescriptor } from '@/feature/upload/utils/video-gps';
import {
  UPLOAD_ABORTED_BY_USER_MESSAGE,
  VIDEO_SIZE_EXCEEDED_MESSAGE,
} from '@/constants/message';

jest.mock('@/api/survey-submission/survey-submission', () => ({
  completeSurveyUpload: jest.fn(),
  getSurveyUploadSession: jest.fn(),
  initializeSurveyUpload: jest.fn(),
  uploadSurveyChunk: jest.fn(),
}));

jest.mock('@/feature/upload/utils/video-processor', () => ({
  calculateTemporalChunks: jest.fn(),
  getVideoFileSizeBytes: jest.fn(),
  prepareVideoChunk: jest.fn(),
  MAX_BACKEND_CHUNK_BYTES: 45 * 1024 * 1024,
  MAX_SURVEY_VIDEO_SIZE_BYTES: 500 * 1024 * 1024,
}));

jest.mock('@/feature/upload/utils/survey-image', () => ({
  prepareSurveyGpx: jest.fn(),
}));

jest.mock('@/feature/upload/utils/video-gps', () => ({
  createCompanionGpxDescriptor: jest.fn(),
}));

describe('chunk-upload-manager', () => {
  const defaultParams = {
    submissionId: 'sub-123',
    videoUri: 'file:///path/to/test-video.mp4',
    videoFileName: 'test-video.mp4',
    durationSeconds: 120,
    startCoordinate: [106.7009, 10.7769] as [number, number],
    endCoordinate: [106.7050, 10.7810] as [number, number],
    capturedAt: '2026-11-16T10:00:00.000Z',
    accessToken: 'valid-access-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (getVideoFileSizeBytes as jest.Mock).mockResolvedValue(10 * 1024 * 1024);
    (calculateTemporalChunks as jest.Mock).mockReturnValue({
      totalChunks: 2,
      chunkSize: 5 * 1024 * 1024,
      totalSizeBytes: 10 * 1024 * 1024,
    });
    (initializeSurveyUpload as jest.Mock).mockImplementation((_subId, body) =>
      Promise.resolve({
        sessionId: body.mediaType === 'VIDEO' ? 'video-session-1' : 'gpx-session-1',
      })
    );
    (prepareVideoChunk as jest.Mock).mockResolvedValue({
      request: { chunkIndex: 0, chunk: new Blob([]) },
      cleanup: jest.fn().mockResolvedValue(undefined),
    });
    (uploadSurveyChunk as jest.Mock).mockResolvedValue({ success: true });
    (completeSurveyUpload as jest.Mock).mockResolvedValue({ status: 'COMPLETED' });
    (createCompanionGpxDescriptor as jest.Mock).mockReturnValue({
      uri: 'file:///companion.gpx',
      name: 'companion.gpx',
    });
    (prepareSurveyGpx as jest.Mock).mockResolvedValue({
      fileName: 'companion.gpx',
      sizeBytes: 1024,
      chunk: new Blob([]),
    });
  });

  it('throws error when video file size exceeds MAX_SURVEY_VIDEO_SIZE_BYTES', async () => {
    (getVideoFileSizeBytes as jest.Mock).mockResolvedValue(MAX_SURVEY_VIDEO_SIZE_BYTES + 1000);

    await expect(executeChunkedVideoUpload(defaultParams)).rejects.toThrow(
      VIDEO_SIZE_EXCEEDED_MESSAGE
    );
  });

  it('initializes a fresh session, uploads all chunks, completes video and uploads GPX', async () => {
    const progressList: any[] = [];
    const result = await executeChunkedVideoUpload({
      ...defaultParams,
      onProgress: (p) => progressList.push(p),
    });

    expect(result).toEqual({
      videoSessionId: 'video-session-1',
      gpxSessionId: 'gpx-session-1',
    });

    // 1. Initialized video
    expect(initializeSurveyUpload).toHaveBeenCalledWith(
      'sub-123',
      expect.objectContaining({
        originalFilename: 'test-video.mp4',
        mediaType: 'VIDEO',
        totalChunks: 2,
      }),
      'valid-access-token',
      undefined
    );

    // 2. Uploaded video chunks
    expect(uploadSurveyChunk).toHaveBeenCalledTimes(3); // 2 video chunks + 1 GPX chunk
    expect(completeSurveyUpload).toHaveBeenCalledWith('video-session-1', 'valid-access-token', undefined);
    expect(completeSurveyUpload).toHaveBeenCalledWith('gpx-session-1', 'valid-access-token', undefined);

    // 3. Companion GPX was auto-generated
    expect(createCompanionGpxDescriptor).toHaveBeenCalledWith({
      startCoordinate: defaultParams.startCoordinate,
      endCoordinate: defaultParams.endCoordinate,
      capturedAt: defaultParams.capturedAt,
      durationSeconds: defaultParams.durationSeconds,
    });

    // 4. Progress callbacks were called
    expect(progressList.length).toBeGreaterThanOrEqual(4);
    expect(progressList[progressList.length - 1].percent).toBe(100);
  });

  it('uses manual GPX file descriptor when manualGpxUri is provided', async () => {
    await executeChunkedVideoUpload({
      ...defaultParams,
      manualGpxUri: 'file:///manual-route.gpx',
      manualGpxName: 'my-route.gpx',
    });

    expect(createCompanionGpxDescriptor).not.toHaveBeenCalled();
    expect(prepareSurveyGpx).toHaveBeenCalledWith({
      uri: 'file:///manual-route.gpx',
      name: 'my-route.gpx',
    });
  });

  it('resumes existing session and only uploads missing chunks', async () => {
    (getSurveyUploadSession as jest.Mock).mockResolvedValue({
      session: {
        id: 'existing-video-sess',
        status: 'UPLOADING',
        totalChunks: 2,
      },
      chunks: [{ chunkIndex: 0 }], // Chunk 0 was already uploaded
    });

    const result = await executeChunkedVideoUpload({
      ...defaultParams,
      existingSessionId: 'existing-video-sess',
    });

    expect(result.videoSessionId).toBe('existing-video-sess');
    expect(initializeSurveyUpload).toHaveBeenCalledTimes(1); // Only for GPX, not for video
    // Only chunk 1 uploaded for video + 1 chunk for GPX
    expect(uploadSurveyChunk).toHaveBeenCalledTimes(2);
  });

  it('re-initializes fresh session if existing session has mismatched totalChunks', async () => {
    (getSurveyUploadSession as jest.Mock).mockResolvedValue({
      session: {
        id: 'old-session',
        status: 'UPLOADING',
        totalChunks: 5, // mismatched: current plan has 2 chunks
      },
      chunks: [],
    });

    const result = await executeChunkedVideoUpload({
      ...defaultParams,
      existingSessionId: 'old-session',
    });

    expect(result.videoSessionId).toBe('video-session-1');
    expect(initializeSurveyUpload).toHaveBeenCalledWith(
      'sub-123',
      expect.objectContaining({ mediaType: 'VIDEO' }),
      'valid-access-token',
      undefined
    );
  });

  it('handles getSurveyUploadSession error gracefully and falls back to fresh initialization', async () => {
    (getSurveyUploadSession as jest.Mock).mockRejectedValue(new Error('Session not found'));

    const result = await executeChunkedVideoUpload({
      ...defaultParams,
      existingSessionId: 'corrupted-session',
    });

    expect(result.videoSessionId).toBe('video-session-1');
  });

  it('handles existing session that is already COMPLETED', async () => {
    (getSurveyUploadSession as jest.Mock).mockResolvedValue({
      session: {
        id: 'completed-sess',
        status: 'COMPLETED',
        totalChunks: 2,
      },
      chunks: [{ chunkIndex: 0 }, { chunkIndex: 1 }],
    });

    const result = await executeChunkedVideoUpload({
      ...defaultParams,
      existingSessionId: 'completed-sess',
    });

    expect(result.videoSessionId).toBe('completed-sess');
    // No video chunk uploaded, only 1 GPX chunk
    expect(uploadSurveyChunk).toHaveBeenCalledTimes(1);
  });

  it('aborts upload when signal is aborted', async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      executeChunkedVideoUpload({
        ...defaultParams,
        signal: controller.signal,
      })
    ).rejects.toThrow(UPLOAD_ABORTED_BY_USER_MESSAGE);
  });

  it('retries chunk upload on transient failure and succeeds on retry', async () => {
    let callCount = 0;
    (uploadSurveyChunk as jest.Mock).mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.reject(new Error('Network timeout'));
      }
      return Promise.resolve({ success: true });
    });

    const result = await executeChunkedVideoUpload(defaultParams);
    expect(result.videoSessionId).toBe('video-session-1');
    expect(callCount).toBeGreaterThanOrEqual(3); // 1 retry + other calls
  });

  it('fails upload when chunk upload fails repeatedly after retries', async () => {
    (uploadSurveyChunk as jest.Mock).mockRejectedValue(new Error('Persistent 500 error'));

    await expect(executeChunkedVideoUpload(defaultParams)).rejects.toThrow(
      'Persistent 500 error'
    );
  });
});
