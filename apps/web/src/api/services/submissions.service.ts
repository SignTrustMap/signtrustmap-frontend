import { http } from '../client'
import { API_ENDPOINTS } from '../endpoints'
import type {
  CreateSubmissionDto,
  UpdateSubmissionDto,
  InitializeUploadDto,
  InitializeUploadResponse,
  UploadChunkResponse,
  CompleteUploadResponse,
  SurveySubmission,
  ListMySubmissionsResponse,
  PendingSubmissionsResponse,
  SurveyorStatsResponse,
  SubmissionStatusResponse,
  SubmissionType,
  CoordinateSource,
  SurveyMediaType,
} from '@shared/types'

export const BACKEND_MAX_CHUNK_BYTES = 52428800 // 50 MB absolute backend limit (52,428,800 bytes)
export const MAX_BACKEND_CHUNK_BYTES = 45 * 1024 * 1024 // 45 MB safety margin under backend's 50MB limit
export const DEFAULT_1MIN_CHUNK_BYTES = 10 * 1024 * 1024 // 10 MB estimated for 1 min of 640p/720p

export type ChunkPlan = {
  totalChunks: number
  chunkSize: number
  totalSizeBytes: number
  durationSeconds: number
}

/**
 * Calculates temporal 1-minute chunks for an up to 8-hour survey video (exact parity with Mobile).
 * Adheres directly to the Mobile specification:
 * - Temporal chunk: 1 minute per chunk
 * - Target chunk size: 10 MB (DEFAULT_1MIN_CHUNK_BYTES) matching Mobile standard
 * - Maximum video duration: 8 hours (28,800s)
 */
export function calculateTemporalChunks(
  fileSizeBytes: number,
  durationSeconds = 60,
  maxChunkSizeBytes = DEFAULT_1MIN_CHUNK_BYTES
): ChunkPlan {
  const safeDuration =
    Number.isFinite(durationSeconds) && durationSeconds > 0
      ? Math.min(28800, durationSeconds) // Cap at 8 hours
      : 60

  // 1 minute per temporal chunk
  let totalChunks = Math.max(1, Math.ceil(safeDuration / 60))
  let chunkSize = Math.ceil(fileSizeBytes / totalChunks)

  // Guarantee that chunk size does not exceed the target 10 MB chunk size (Mobile standard)
  if (chunkSize > maxChunkSizeBytes) {
    totalChunks = Math.ceil(fileSizeBytes / maxChunkSizeBytes)
    chunkSize = Math.ceil(fileSizeBytes / totalChunks)
  }

  // Strict guard: Guarantee totalSizeBytes <= totalChunks * 52428800 bytes
  if (fileSizeBytes > totalChunks * BACKEND_MAX_CHUNK_BYTES) {
    totalChunks = Math.ceil(fileSizeBytes / BACKEND_MAX_CHUNK_BYTES)
    chunkSize = Math.ceil(fileSizeBytes / totalChunks)
  }

  // Backend limit: MAX_CHUNKS_PER_SESSION = 5000
  if (totalChunks > 5000) {
    totalChunks = 5000
    chunkSize = Math.ceil(fileSizeBytes / totalChunks)
  }

  return {
    totalChunks,
    chunkSize,
    totalSizeBytes: fileSizeBytes,
    durationSeconds: safeDuration,
  }
}

export interface ChunkedUploadProgress {
  step: 'initializing' | 'uploading_video' | 'uploading_gpx' | 'completing' | 'submitting' | 'done'
  percent: number
  currentChunk?: number
  totalChunks?: number
  bytesUploaded?: number
  totalBytes?: number
}

/**
 * Helper: retry an async chunk operation with exponential backoff
 */
async function retryChunkOperation<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: any
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn()
    } catch (err: any) {
      lastError = err
      console.warn(`[SubmissionsService] Chunk upload attempt ${attempt}/${retries} failed:`, err?.message || err)
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)))
      }
    }
  }
  throw lastError
}

/**
 * Functional Service Object for Survey Submissions and Chunked Ingestion.
 * Complies with RULE.md §6.5 (Functional Service Objects) and submission-contract.md.
 */
export const submissionsService = {
  /**
   * Create a new draft submission with metadata before uploading media.
   *
   * @param dto - Submission parameters (type, capturedAt, coordinateSource, note, coordinates).
   */
  createSubmission: (dto: CreateSubmissionDto): Promise<SurveySubmission> => {
    return http.post<SurveySubmission>(API_ENDPOINTS.SUBMISSIONS.BASE, dto)
  },

  /**
   * Update an existing draft submission metadata.
   *
   * @param submissionId - UUID of the submission draft.
   * @param dto - Metadata updates.
   */
  updateSubmission: (submissionId: string, dto: UpdateSubmissionDto): Promise<SurveySubmission> => {
    return http.patch<SurveySubmission>(API_ENDPOINTS.SUBMISSIONS.DETAIL(submissionId), dto)
  },

  /**
   * Initialize a chunked media upload session for an existing draft.
   *
   * @param submissionId - Target submission UUID.
   * @param dto - Upload parameters (originalFilename, mediaType, totalSizeBytes, totalChunks).
   */
  initializeUpload: (
    submissionId: string,
    dto: InitializeUploadDto
  ): Promise<InitializeUploadResponse> => {
    return http.post<InitializeUploadResponse>(API_ENDPOINTS.SUBMISSIONS.UPLOADS(submissionId), dto)
  },

  /**
   * Upload a single binary chunk of a media file via multipart/form-data.
   * Overrides timeout to 300s (5 minutes) and hooks into onUploadProgress for smooth byte-level UX.
   *
   * @param sessionId - Upload session UUID.
   * @param chunkIndex - Zero-based index of this chunk.
   * @param chunk - Binary slice of the file.
   * @param fileName - Original filename for multipart boundary header.
   * @param options - Optional timeout override, AbortSignal, and progress callback.
   */
  uploadChunk: (
    sessionId: string,
    chunkIndex: number,
    chunk: Blob,
    fileName: string,
    options?: {
      timeout?: number
      signal?: AbortSignal
      onProgress?: (loadedBytes: number, totalChunkBytes: number) => void
    }
  ): Promise<UploadChunkResponse> => {
    const formData = new FormData()
    formData.append('file', chunk, fileName)
    formData.append('chunkIndex', String(chunkIndex))

    return http.post<UploadChunkResponse>(
      API_ENDPOINTS.SUBMISSIONS.CHUNKS(sessionId),
      formData,
      {
        timeout: options?.timeout ?? 300000, // 5 minutes per chunk (accommodates up to 45MB chunks)
        signal: options?.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.loaded && options?.onProgress) {
            options.onProgress(progressEvent.loaded, progressEvent.total || chunk.size)
          }
        },
      }
    )
  },

  /**
   * Signal the backend that all chunks have been received and request MinIO file assembly.
   * Uses 300s timeout to allow MinIO chunk stitching, SHA256 checksum, and media validation.
   *
   * @param sessionId - Upload session UUID.
   * @param options - Optional timeout and AbortSignal.
   */
  completeUpload: (
    sessionId: string,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<CompleteUploadResponse> => {
    return http.post<CompleteUploadResponse>(
      API_ENDPOINTS.SUBMISSIONS.COMPLETE(sessionId),
      {},
      {
        timeout: options?.timeout ?? 300000, // 5 minutes for server MinIO assembly & SHA256 hashing
        signal: options?.signal,
      }
    )
  },

  /**
   * Submit a fully uploaded submission to trigger the AI processing pipeline (moves from DRAFT to QUEUED).
   *
   * @param submissionId - UUID of the completed draft.
   * @param options - Optional timeout and AbortSignal.
   */
  submitSubmission: (
    submissionId: string,
    options?: { timeout?: number; signal?: AbortSignal }
  ): Promise<{ success: boolean; status: string }> => {
    return http.post<{ success: boolean; status: string }>(
      API_ENDPOINTS.SUBMISSIONS.SUBMIT(submissionId),
      {},
      {
        timeout: options?.timeout ?? 60000, // 60 seconds
        signal: options?.signal,
      }
    )
  },

  /**
   * Retrieve a paginated list of survey submissions uploaded by current surveyor.
   *
   * @param params - Pagination parameters (page, pageSize).
   */
  getMySubmissions: (params?: { page?: number; pageSize?: number }): Promise<ListMySubmissionsResponse> => {
    const page = params?.page ?? 1
    const pageSize = params?.pageSize ?? 20
    return http.get<ListMySubmissionsResponse>(
      `${API_ENDPOINTS.SUBMISSIONS.ME}?page=${page}&pageSize=${pageSize}`
    )
  },

  /**
   * Retrieve pending submission counts awaiting AI processing.
   */
  getMyPending: (): Promise<PendingSubmissionsResponse> => {
    return http.get<PendingSubmissionsResponse>(API_ENDPOINTS.SUBMISSIONS.PENDING)
  },

  /**
   * Retrieve contributor statistics (approved signs, earned credits, submission count).
   */
  getMyStats: (): Promise<SurveyorStatsResponse> => {
    return http.get<SurveyorStatsResponse>(API_ENDPOINTS.SUBMISSIONS.STATS)
  },

  /**
   * Retrieve live AI processing status, stages, and extracted candidates for a submission.
   *
   * @param submissionId - UUID of the submission to inspect.
   */
  getSubmissionStatus: (submissionId: string): Promise<SubmissionStatusResponse> => {
    return http.get<SubmissionStatusResponse>(API_ENDPOINTS.SUBMISSIONS.STATUS(submissionId))
  },

  /**
   * High-level orchestrated Chunked Uploader.
   * Handles temporal chunking (matching Mobile: 1-min chunks up to 45 MB limit),
   * session initialization, resilient chunk dispatch with retries,
   * companion GPX upload, server-side assembly, and pipeline submission.
   *
   * @param file - Primary media file (Video MP4/MOV or Image JPEG/PNG).
   * @param options - Upload configurations, companion GPX, and progress callback.
   */
  executeFullChunkedUpload: async (
    file: File,
    options: {
      submissionType: SubmissionType
      capturedAt: string
      coordinateSource: CoordinateSource
      note?: string
      latitude?: number
      longitude?: number
      durationSeconds?: number
      gpxFile?: File
      onProgress?: (progress: ChunkedUploadProgress) => void
      signal?: AbortSignal
      checkPaused?: () => boolean
    }
  ): Promise<{ submissionId: string; status: string }> => {
    const { onProgress, signal, checkPaused } = options

    // 1. Create Submission Draft
    onProgress?.({ step: 'initializing', percent: 5 })
    const submission = await submissionsService.createSubmission({
      submissionType: options.submissionType,
      capturedAt: options.capturedAt,
      coordinateSource: options.coordinateSource,
      note: options.note,
      latitude: options.latitude,
      longitude: options.longitude,
    })

    const submissionId = submission.id

    // Helper: Upload any file using Mobile's chunking protocol with retries & progress
    const uploadSingleFile = async (
      targetFile: File,
      mediaType: SurveyMediaType,
      startProgressPercent: number,
      endProgressPercent: number,
      stepName: ChunkedUploadProgress['step'],
      videoDurationSeconds?: number
    ) => {
      const totalSizeBytes = targetFile.size
      let totalChunks = 1
      let chunkSize = totalSizeBytes

      if (mediaType === 'VIDEO') {
        const plan = calculateTemporalChunks(
          totalSizeBytes,
          videoDurationSeconds ?? options.durationSeconds ?? 60
        )
        totalChunks = plan.totalChunks
        chunkSize = plan.chunkSize
      } else {
        totalChunks = 1
        chunkSize = totalSizeBytes
      }

      const initResponse = await submissionsService.initializeUpload(submissionId, {
        originalFilename: targetFile.name,
        mediaType,
        totalSizeBytes,
        totalChunks,
      })

      const sessionId = initResponse.sessionId

      for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
        // Handle user pause state
        while (checkPaused?.()) {
          await new Promise((resolve) => setTimeout(resolve, 300))
          if (signal?.aborted) throw new Error('Quá trình tải lên đã bị hủy')
        }
        if (signal?.aborted) throw new Error('Quá trình tải lên đã bị hủy')

        const start = chunkIndex * chunkSize
        const end = Math.min(start + chunkSize, totalSizeBytes)
        const chunkBlob = targetFile.slice(start, end)

        await retryChunkOperation(
          () =>
            submissionsService.uploadChunk(
              sessionId,
              chunkIndex,
              chunkBlob,
              targetFile.name,
              {
                signal,
                timeout: 300000, // 5 minutes per chunk (accommodates Mobile's up-to-45MB chunks)
                onProgress: (loadedInChunk) => {
                  const currentTotalUploaded = Math.min(totalSizeBytes, start + loadedInChunk)
                  const chunkFraction = currentTotalUploaded / totalSizeBytes
                  const mappedPercent = Math.min(
                    endProgressPercent,
                    Math.round(startProgressPercent + chunkFraction * (endProgressPercent - startProgressPercent))
                  )
                  onProgress?.({
                    step: stepName,
                    percent: mappedPercent,
                    currentChunk: chunkIndex + 1,
                    totalChunks,
                    bytesUploaded: currentTotalUploaded,
                    totalBytes: totalSizeBytes,
                  })
                },
              }
            ),
          3,
          1000
        )

        // Ensure progress state reflects chunk completion
        const chunkDonePercent = Math.min(
          endProgressPercent,
          Math.round(
            startProgressPercent + ((chunkIndex + 1) / totalChunks) * (endProgressPercent - startProgressPercent)
          )
        )
        onProgress?.({
          step: stepName,
          percent: chunkDonePercent,
          currentChunk: chunkIndex + 1,
          totalChunks,
          bytesUploaded: end,
          totalBytes: totalSizeBytes,
        })
      }

      // Complete Assembly on MinIO
      onProgress?.({
        step: 'completing',
        percent: endProgressPercent,
        currentChunk: totalChunks,
        totalChunks,
        bytesUploaded: totalSizeBytes,
        totalBytes: totalSizeBytes,
      })
      await submissionsService.completeUpload(sessionId, { signal, timeout: 300000 })
    }

    // 2. Upload Primary File (Video or Image)
    const isVideo = options.submissionType === 'VIDEO_GPX'
    const primaryMediaType: SurveyMediaType = isVideo ? 'VIDEO' : 'IMAGE'
    const videoEndPercent = options.gpxFile ? 80 : 92

    await uploadSingleFile(
      file,
      primaryMediaType,
      10,
      videoEndPercent,
      isVideo ? 'uploading_video' : 'uploading_video',
      options.durationSeconds
    )

    // 3. Upload Companion GPX file if available
    if (options.gpxFile) {
      await uploadSingleFile(options.gpxFile, 'GPX', 80, 95, 'uploading_gpx')
    }

    // 4. Submit to Celery AI Queue
    onProgress?.({ step: 'submitting', percent: 98 })
    const submitResult = await submissionsService.submitSubmission(submissionId, { signal })

    onProgress?.({ step: 'done', percent: 100 })

    return {
      submissionId,
      status: submitResult.status || 'QUEUED',
    }
  },
}
