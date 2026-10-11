/**
 * @file survey.ts
 * @description Domain contracts, DTOs, and API response types for Survey Submissions and Chunked Uploads.
 */

export type SubmissionType = 'VIDEO_GPX' | 'SINGLE_IMAGE' | 'LIVE_TRIP'

export type CoordinateSource = 'IMAGE_EXIF' | 'DEVICE_GPS' | 'MANUAL' | 'GPX_FILE' | 'LIVE_STREAM'

export type SurveyMediaType = 'VIDEO' | 'GPX' | 'IMAGE'

export type UploadStatus =
  | 'INITIATED'
  | 'UPLOADING'
  | 'ASSEMBLING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'

export type SubmissionStatus =
  | 'QUEUED'
  | 'SYNCHRONIZING'
  | 'DETECTING'
  | 'TRACKING'
  | 'ESTIMATING'
  | 'CLASSIFYING'
  | 'COMPLETED'
  | 'PARTIALLY_PROCESSED'
  | 'FAILED'
  | 'PENDING_CORRECTION'
  | 'NO_SIGN_DETECTED'
  | 'DRAFT'
  | 'REJECTED'

export interface CreateSubmissionDto {
  submissionType: SubmissionType
  capturedAt: string
  coordinateSource: CoordinateSource
  note?: string
  latitude?: number
  longitude?: number
}

export type UpdateSubmissionDto = Partial<Omit<CreateSubmissionDto, 'submissionType'>>

export interface InitializeUploadDto {
  originalFilename: string
  mediaType: SurveyMediaType
  totalSizeBytes: number
  totalChunks: number
  checksumExpected?: string
}

export interface InitializeUploadResponse {
  sessionId: string
  originalFilename: string
  mediaType: SurveyMediaType
  totalSizeBytes: string
  totalChunks: number
  receivedChunks: number
  status: UploadStatus
  expiresAt: string
  createdAt: string
}

export interface UploadChunkBodyDto {
  chunkIndex: number
  checksum?: string
}

export interface UploadChunkResponse {
  sessionId: string
  chunkIndex: number
  storageKey: string
  sizeBytes: number
  receivedChunks: number
  totalChunks: number
  status: UploadStatus
  readyToComplete: boolean
  isComplete: false
  submissionId: string | null
}

export interface CompleteUploadResponse {
  sessionId: string
  submissionId: string
  mediaFileId: string
  status: 'COMPLETED'
  submissionStatus: SubmissionStatus
  storageKey: string | null
  sizeBytes: number
  checksum: string | null
}

export interface SurveySubmission {
  id: string
  surveyorId: string
  submissionType: SubmissionType
  status: SubmissionStatus
  failureReason: string | null
  totalCandidatesExtracted: number
  latitude?: number | null
  longitude?: number | null
  coordinateSource?: CoordinateSource
  capturedAt?: string
  note?: string | null
  createdAt: string
  updatedAt: string
}

export interface ListMySubmissionsResponse {
  items: SurveySubmission[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface PendingSubmissionsResponse {
  total: number
  pending: number
  countsByStatus?: Partial<Record<SubmissionStatus, number>>
}

export interface SurveyorStatsResponse {
  userId: string
  totalSubmissions: number
  pendingSubmissions: number
  creditScore: number | null
  revalidationAvailable: number
  dailyTasks: Record<string, unknown>[]
}

export interface SubmissionMediaFile {
  id: string
  media_type: SurveyMediaType
  file_url: string
}

export interface SubmissionStatusResponse {
  submission: SurveySubmission
  totalCandidates: number
  mediaFiles?: SubmissionMediaFile[]
  history: Record<string, unknown>[]
  candidates: Record<string, unknown>[]
  sessions: Record<string, unknown>[]
}

export interface ExtractedCandidateItem {
  id: string
  boxIndex: number
  code: string
  name: string
  category: 'P' | 'W' | 'R' | 'I' | 'S' | string
  confidence: number
  lat: number
  lng: number
  timestampSec: number
  cropUrl: string
  contextUrl: string
  isAccepted: boolean
  isFlagged: boolean
  customLabel?: string
  notes?: string
}

export interface SurveySubmissionItem {
  id: string
  title: string
  createdAt: string
  mediaType: 'VIDEO_GPX' | 'PHOTO_MANUAL' | string
  durationSec?: number
  distanceMeters?: number
  totalExtracted: number
  approvedCount: number
  rejectedCount: number
  rewardCredits: number
  status: 'PENDING_AI' | 'READY_FOR_REVIEW' | 'REVIEWED' | 'REJECTED' | string
  extractedCandidates: ExtractedCandidateItem[]
  gpxTrackPoints?: Array<{ lat: number; lng: number; time?: string; ele?: number }>
}

