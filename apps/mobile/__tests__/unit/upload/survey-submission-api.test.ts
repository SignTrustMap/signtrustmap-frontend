import {
  createSurveySubmission,
  updateSurveySubmission,
  initializeSurveyUpload,
  uploadSurveyChunk,
  completeSurveyUpload,
  submitSurveySubmission,
  getMySubmissions,
  getMyPendingSubmissions,
  getMySurveyStats,
  getSurveySubmissionStatus,
  getSurveyUploadSession,
} from '@/api/survey-submission/survey-submission';
import * as apiClient from '@/api/api-client';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

jest.mock('@/api/api-client', () => {
  class MockApiError extends Error {
    statusCode: number;
    constructor(msg: string, code: number) {
      super(msg);
      this.name = 'ApiError';
      this.statusCode = code;
    }
  }

  return {
    apiRequest: jest.fn(),
    jsonApiRequest: jest.fn(),
    apiBaseUrl: jest.fn(() => 'https://api.signmap.site/api/v1'),
    ApiError: MockApiError,
  };
});

jest.mock('expo-file-system/legacy', () => ({
  uploadAsync: jest.fn(),
  FileSystemUploadType: {
    MULTIPART: 0,
    BINARY_CONTENT: 1,
  },
}));

describe('Survey Submission API Module', () => {
  const mockToken = 'surveyor-token-123';

  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  describe('createSurveySubmission', () => {
    it('sends POST to /submissions with submission dto', async () => {
      const dto = { title: 'Đoạn đường QL1A', vehicleType: 'MOTORCYCLE' };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ id: 'sub-101' });

      const res = await createSurveySubmission(dto as any, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/submissions',
        dto,
        mockToken,
        undefined,
      );
      expect(res.id).toBe('sub-101');
    });
  });

  describe('updateSurveySubmission', () => {
    it('sends PATCH to /submissions/:id with update payload', async () => {
      const dto = { title: 'Đoạn đường QL1A - Đã chỉnh sửa' };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ success: true });

      const res = await updateSurveySubmission('sub-101', dto as any, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/sub-101',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(dto),
        }),
        mockToken,
      );
      expect(res.success).toBe(true);
    });
  });

  describe('initializeSurveyUpload', () => {
    it('sends POST to /submissions/:id/uploads with chunk config', async () => {
      const dto = { totalChunks: 3, totalBytes: 30000000 };
      (apiClient.jsonApiRequest as jest.Mock).mockResolvedValueOnce({ sessionId: 'session-xyz' });

      const res = await initializeSurveyUpload('sub-101', dto as any, mockToken);

      expect(apiClient.jsonApiRequest).toHaveBeenCalledWith(
        '/submissions/sub-101/uploads',
        dto,
        mockToken,
        undefined,
      );
      expect(res.sessionId).toBe('session-xyz');
    });
  });

  describe('uploadSurveyChunk', () => {
    it('uses FileSystem.uploadAsync on native Android/iOS when uploading file URI', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 200,
        body: JSON.stringify({ chunkIndex: 0, success: true }),
      });

      const res = await uploadSurveyChunk(
        'sess-1',
        {
          chunkIndex: 0,
          checksum: 'hash123',
          file: { uri: 'file:///path/to/video_part_0.mp4', type: 'video/mp4' } as any,
        },
        mockToken,
      );

      expect(FileSystem.uploadAsync).toHaveBeenCalledWith(
        'https://api.signmap.site/api/v1/submissions/uploads/sess-1/chunks',
        'file:///path/to/video_part_0.mp4',
        expect.objectContaining({
          httpMethod: 'POST',
          mimeType: 'video/mp4',
          parameters: {
            chunkIndex: '0',
            checksum: 'hash123',
          },
        }),
      );
      expect(res).toEqual({ chunkIndex: 0, success: true });
    });

    it('throws ApiError when FileSystem.uploadAsync returns non-2xx status', async () => {
      (FileSystem.uploadAsync as jest.Mock).mockResolvedValueOnce({
        status: 400,
        body: JSON.stringify({ message: 'Chunk checksum mismatch' }),
      });

      await expect(
        uploadSurveyChunk(
          'sess-1',
          {
            chunkIndex: 1,
            file: { uri: 'file:///chunk1.mp4' } as any,
          },
          mockToken,
        ),
      ).rejects.toThrow('Chunk checksum mismatch');
    });

    it('uses apiRequest with FormData when running on web', async () => {
      Platform.OS = 'web';

      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ chunkIndex: 0, success: true });

      const res = await uploadSurveyChunk(
        'sess-1',
        {
          chunkIndex: 0,
          file: new Blob(['chunk content']),
          fileName: 'video.mp4',
        },
        mockToken,
      );

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/uploads/sess-1/chunks',
        expect.objectContaining({ method: 'POST' }),
        mockToken,
      );
      expect(res).toEqual({ chunkIndex: 0, success: true });
    });
  });

  describe('completeSurveyUpload & submitSurveySubmission', () => {
    it('sends POST to complete upload session', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ complete: true });

      const res = await completeSurveyUpload('sess-1', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/uploads/sess-1/complete',
        { method: 'POST', signal: undefined },
        mockToken,
      );
      expect(res.complete).toBe(true);
    });

    it('sends POST to finalize and submit survey', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ status: 'PROCESSING' });

      const res = await submitSurveySubmission('sub-1', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/sub-1/submit',
        { method: 'POST', signal: undefined },
        mockToken,
      );
      expect(res.status).toBe('PROCESSING');
    });
  });

  describe('my submissions, stats, and status checks', () => {
    it('queries getMySubmissions with pagination', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ items: [], total: 0 });

      await getMySubmissions({ page: '1', pageSize: '10' }, mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/me?page=1&pageSize=10',
        { signal: undefined },
        mockToken,
      );
    });

    it('fetches pending submissions', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ pending: [] });

      const res = await getMyPendingSubmissions(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/me/pending',
        { signal: undefined },
        mockToken,
      );
      expect(res.pending).toEqual([]);
    });

    it('fetches surveyor stats', async () => {
      const stats = { totalSurveys: 12, approvedCount: 10 };
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce(stats);

      const res = await getMySurveyStats(mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/me/stats',
        { signal: undefined },
        mockToken,
      );
      expect(res).toEqual(stats);
    });

    it('fetches submission status', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ status: 'APPROVED' });

      const res = await getSurveySubmissionStatus('sub-99', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/status/sub-99',
        { signal: undefined },
        mockToken,
      );
      expect(res.status).toBe('APPROVED');
    });

    it('fetches upload session info', async () => {
      (apiClient.apiRequest as jest.Mock).mockResolvedValueOnce({ sessionId: 'sess-88' });

      const res = await getSurveyUploadSession('sess-88', mockToken);

      expect(apiClient.apiRequest).toHaveBeenCalledWith(
        '/submissions/uploads/sess-88',
        { signal: undefined },
        mockToken,
      );
      expect(res.sessionId).toBe('sess-88');
    });
  });
});
