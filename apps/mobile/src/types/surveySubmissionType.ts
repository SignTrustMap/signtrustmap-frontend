// Request DTOs match the supplied OpenAPI document. Response bodies are not
// declared there; new responses remain unknown and existing read shapes below
// retain the last documented local backend contract. Dates are JSON strings.
export type SubmissionType = 'VIDEO_GPX' | 'SINGLE_IMAGE' | 'LIVE_TRIP';
export type CoordinateSource = 'IMAGE_EXIF' | 'DEVICE_GPS' | 'MANUAL' | 'GPX_FILE' | 'LIVE_STREAM';

export type CreateSubmissionDto = {
  submissionType: SubmissionType;
  capturedAt: string;
  coordinateSource: CoordinateSource;
  /** Maximum length: 2000 characters. */
  note?: string;
  /** Range: -90 to 90. */
  latitude?: number;
  /** Range: -180 to 180. */
  longitude?: number;
};

export type UpdateSubmissionDto = Partial<Omit<CreateSubmissionDto, 'submissionType'>>;
export type CreateSubmissionResponse = unknown;
export type UpdateSubmissionResponse = unknown;
export type SubmitSubmissionResponse = unknown;

export type SurveyMediaType = 'VIDEO' | 'GPX' | 'IMAGE';

export type UploadStatus =
  | 'INITIATED' | 'UPLOADING' | 'ASSEMBLING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';

export type SubmissionStatus =
  | 'QUEUED' | 'SYNCHRONIZING' | 'DETECTING' | 'TRACKING' | 'ESTIMATING'
  | 'CLASSIFYING' | 'COMPLETED' | 'PARTIALLY_PROCESSED' | 'FAILED'
  | 'PENDING_CORRECTION' | 'NO_SIGN_DETECTED' | 'DRAFT' | 'REJECTED';

export type SubmissionIssueDto = {
  /** Maximum length: 100 characters. */
  code: string;
  /** Maximum length: 200 characters. */
  field: string;
  /** Maximum length: 1000 characters. */
  message: string;
  mediaType?: SurveyMediaType;
};

export type InitializeUploadDto = {
  /** Maximum length: 500 characters. */
  originalFilename: string;
  mediaType: SurveyMediaType;
  /** Range: 1 to 2147483648 bytes. */
  totalSizeBytes: number;
  /** Range: 1 to 5000. */
  totalChunks: number;
  /** Maximum length: 128 characters. */
  checksumExpected?: string;
};

export type UploadChunkBodyDto = {
  /** Zero-based chunk index, range: 0 to 5000. */
  chunkIndex: number;
  checksum?: string;
};

export type NativeUploadFile = {
  uri: string;
  name: string;
  /** MIME type, for example image/jpeg or video/mp4. */
  type: string;
};

export type UploadChunkRequest = UploadChunkBodyDto & {
  /** Browser Blob/File or React Native file descriptor. */
  file: Blob | NativeUploadFile;
  /** Optional filename override for a browser Blob/File. */
  fileName?: string;
};

export type ListMySubmissionsParams = {
  /** Pagination values are query strings in the supplied OpenAPI schema. */
  page: string;
  pageSize: string;
};

export type InitializeUploadResponse = {
  sessionId: string;
  originalFilename: string;
  mediaType: SurveyMediaType;
  /** PostgreSQL bigint is serialized as a string. */
  totalSizeBytes: string;
  totalChunks: number;
  receivedChunks: number;
  status: UploadStatus;
  expiresAt: string;
  createdAt: string;
};

export type UploadChunkResponse = {
  sessionId: string;
  chunkIndex: number;
  storageKey: string;
  sizeBytes: number;
  receivedChunks: number;
  totalChunks: number;
  status: UploadStatus;
  readyToComplete: boolean;
  isComplete: false;
  submissionId: string | null;
};

export type CompleteUploadResponse = {
  sessionId: string;
  submissionId: string;
  mediaFileId: string;
  status: 'COMPLETED';
  submissionStatus: SubmissionStatus;
  storageKey: string | null;
  sizeBytes: number;
  checksum: string | null;
};

export type SurveySubmission = {
  capturedAt?: string;
  coordinateSource?: CoordinateSource;
  latitude?: number | null;
  longitude?: number | null;
  note?: string | null;
  id: string;
  surveyorId: string;
  submissionType: SubmissionType;
  status: SubmissionStatus;
  failureReason: string | null;
  totalCandidatesExtracted: number;
  createdAt: string;
  updatedAt: string;
};

export type ListMySubmissionsResponse = {
  items: SurveySubmission[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type PendingSubmissionsResponse = { total: number; pending: number; countsByStatus?: Partial<Record<SubmissionStatus, number>> };

export type SurveyorStatsResponse = {
  userId: string;
  totalSubmissions: number;
  pendingSubmissions: number;
  creditScore: number | null;
  revalidationAvailable: number;
  /** Raw database rows without a declared response DTO. */
  dailyTasks: Record<string, unknown>[];
};

export type SubmissionStatusResponse = {
  mediaFiles?: { id: string; media_type: SurveyMediaType; file_url: string }[];
  submission: SurveySubmission;
  totalCandidates: number;
  /** Raw SQL rows use snake_case keys and have no declared response DTOs. */
  history: Record<string, unknown>[];
  candidates: Record<string, unknown>[];
  sessions: Record<string, unknown>[];
};

export type UploadSession = Omit<InitializeUploadResponse, 'sessionId'> & {
  id: string;
  userId: string;
  checksumExpected: string | null;
  storageKey: string | null;
  submissionId: string | null;
  updatedAt: string;
};

export type UploadChunk = {
  id: string;
  sessionId: string;
  chunkIndex: number;
  sizeBytes: number;
  storageKey: string;
  checksum: string | null;
  uploadedAt: string;
};

export type UploadSessionResponse = { session: UploadSession; chunks: UploadChunk[] };
