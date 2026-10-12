import type {
  InitializeUploadResponse,
  PendingSubmissionsResponse,
  SubmissionStatusResponse,
  SurveyorStatsResponse,
  UploadChunkResponse,
  UploadSessionResponse,
} from '@/types/surveySubmissionType';

export const mockCreatedSubmission = {
  id: 'sub-test-001',
  submissionId: 'sub-test-001',
  status: 'DRAFT' as const,
  submissionType: 'SINGLE_IMAGE' as const,
  capturedAt: '2026-10-01T08:00:00Z',
  coordinateSource: 'IMAGE_EXIF' as const,
  latitude: 10.7769,
  longitude: 106.7009,
};

export const mockInitializeUploadResponse: InitializeUploadResponse = {
  sessionId: 'sess-test-001',
  originalFilename: 'survey-image.jpg',
  mediaType: 'IMAGE',
  totalSizeBytes: '1048576',
  totalChunks: 1,
  receivedChunks: 0,
  status: 'INITIATED',
  expiresAt: new Date(Date.now() + 3600000).toISOString(),
  createdAt: new Date().toISOString(),
};

export const mockUploadChunkResponse: UploadChunkResponse = {
  sessionId: 'sess-test-001',
  chunkIndex: 0,
  storageKey: 'submissions/sub-test-001/chunk-0.bin',
  sizeBytes: 1048576,
  receivedChunks: 1,
  totalChunks: 1,
  status: 'UPLOADING',
  readyToComplete: true,
  isComplete: false,
  submissionId: 'sub-test-001',
};

export const mockCompleteUploadResponse = {
  sessionId: 'sess-test-001',
  status: 'COMPLETED' as const,
  message: 'Upload assembled successfully',
};

export const mockSubmitSubmissionResponse = {
  submissionId: 'sub-test-001',
  status: 'QUEUED' as const,
  submissionStatus: 'QUEUED' as const,
  message: 'Survey submission queued for AI extraction',
};

export const mockSubmissionStatusResponse: SubmissionStatusResponse = {
  submission: {
    id: 'sub-test-001',
    surveyorId: 'surveyor-user-1',
    submissionType: 'SINGLE_IMAGE',
    status: 'DRAFT',
    capturedAt: '2026-10-01T08:00:00Z',
    coordinateSource: 'IMAGE_EXIF',
    latitude: 10.7769,
    longitude: 106.7009,
    note: 'Sample draft note',
    failureReason: null,
    totalCandidatesExtracted: 0,
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:00:00Z',
  },
  mediaFiles: [
    {
      id: 'media-001',
      media_type: 'IMAGE',
      file_url: 'https://s3.signmap.site/stm-raw-images/image.jpg',
    },
  ],
  sessions: [
    {
      id: 'sess-test-001',
      media_type: 'IMAGE',
      status: 'COMPLETED',
      total_chunks: 1,
      received_chunks: 1,
    },
  ],
  totalCandidates: 0,
  history: [],
  candidates: [],
};

export const mockPendingSubmissionsResponse: PendingSubmissionsResponse = {
  total: 4,
  pending: 4,
  countsByStatus: {
    DRAFT: 1,
    QUEUED: 2,
    DETECTING: 1,
  },
};

export const mockSurveyorStatsResponse: SurveyorStatsResponse = {
  userId: 'surveyor-user-1',
  totalSubmissions: 12,
  pendingSubmissions: 4,
  creditScore: 100,
  revalidationAvailable: 5,
  dailyTasks: [],
};

export const mockUploadSessionResponse: UploadSessionResponse = {
  session: {
    id: 'sess-test-001',
    userId: 'surveyor-user-1',
    originalFilename: 'survey-image.jpg',
    mediaType: 'IMAGE',
    totalSizeBytes: '1048576',
    totalChunks: 1,
    receivedChunks: 1,
    status: 'COMPLETED',
    checksumExpected: null,
    storageKey: 'submissions/sub-test-001/final.jpg',
    submissionId: 'sub-test-001',
    expiresAt: '2026-10-01T09:00:00Z',
    createdAt: '2026-10-01T08:00:00Z',
    updatedAt: '2026-10-01T08:05:00Z',
  },
  chunks: [
    {
      id: 'chunk-001',
      sessionId: 'sess-test-001',
      chunkIndex: 0,
      sizeBytes: 1048576,
      storageKey: 'submissions/sub-test-001/chunk-0.bin',
      checksum: null,
      uploadedAt: '2026-10-01T08:01:00Z',
    },
  ],
};
