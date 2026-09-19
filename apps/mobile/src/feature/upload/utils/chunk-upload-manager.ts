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
  MAX_BACKEND_CHUNK_BYTES,
} from './video-processor';
import { prepareSurveyGpx } from './survey-image';
import { createCompanionGpxDescriptor } from './video-gps';

export type UploadProgressInfo = {
  currentChunk: number;
  totalChunks: number;
  percent: number;
  stage: 'preparing' | 'uploading_video' | 'uploading_gpx' | 'completing';
  statusText: string;
};

export type ExecuteChunkedVideoUploadParams = {
  submissionId: string;
  videoUri: string;
  videoFileName?: string;
  durationSeconds?: number;
  startCoordinate: [longitude: number, latitude: number];
  endCoordinate: [longitude: number, latitude: number];
  capturedAt: string;
  accessToken: string;
  existingSessionId?: string;
  manualGpxUri?: string;
  manualGpxName?: string;
  onProgress?: (info: UploadProgressInfo) => void;
  signal?: AbortSignal;
};

async function retryOperation<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1000,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * Manages the entire 1-minute temporal chunk upload pipeline for video surveys:
 * 1. Computes 1-minute temporal chunks (for up to 8h video).
 * 2. Checks resumability via `GET /submissions/uploads/:sessionId` to only send missing chunks.
 * 3. Uploads each chunk independently with fault-isolated retry logic (Low storage/RAM overhead).
 * 4. Completes video assembly on backend.
 * 5. Uploads companion GPX (auto-generated or manual override) to fulfill backend's VIDEO_GPX contract.
 */
export async function executeChunkedVideoUpload(
  params: ExecuteChunkedVideoUploadParams,
): Promise<{ videoSessionId: string; gpxSessionId: string }> {
  const {
    submissionId,
    videoUri,
    videoFileName,
    durationSeconds = 60,
    startCoordinate,
    endCoordinate,
    capturedAt,
    accessToken,
    existingSessionId,
    manualGpxUri,
    manualGpxName,
    onProgress,
    signal,
  } = params;

  console.log(`[ChunkUpload] Starting upload pipeline: submissionId=${submissionId}, videoUri=${videoUri}, duration=${durationSeconds}s`);

  onProgress?.({
    currentChunk: 0,
    totalChunks: 1,
    percent: 0,
    stage: 'preparing',
    statusText: 'Preparing video for chunk upload...',
  });

  const fileName = videoFileName?.trim()
    || videoUri.split('/').pop()?.split('?')[0]
    || `survey-video-${Date.now()}.mp4`;

  // Safely inspect video file size without reading entire file into memory
  // Caps chunk size at MAX_BACKEND_CHUNK_BYTES (45MB safety margin under backend's 50MB / 52428800 bytes limit)
  const totalSizeBytes = await getVideoFileSizeBytes(videoUri);
  const plan = calculateTemporalChunks(totalSizeBytes, durationSeconds, MAX_BACKEND_CHUNK_BYTES);
  console.log(`[ChunkUpload] Video file: "${fileName}", size=${totalSizeBytes} bytes, duration=${durationSeconds}s. Computed plan: ${plan.totalChunks} chunks of ~${plan.chunkSize} bytes.`);

  // 1. Initialize or resume video upload session
  let sessionId = existingSessionId;
  let missingIndices: number[] = [];

  if (sessionId) {
    try {
      console.log(`[ChunkUpload] Checking existing session: ${sessionId}`);
      const sessionInfo = await getSurveyUploadSession(sessionId, accessToken, signal);
      if (sessionInfo.session.status === 'COMPLETED') {
        missingIndices = [];
      } else if (sessionInfo.session.totalChunks !== plan.totalChunks) {
        console.log(`[ChunkUpload] Existing session totalChunks (${sessionInfo.session.totalChunks}) does not match current plan (${plan.totalChunks}). Re-initializing fresh session.`);
        sessionId = undefined;
      } else {
        const uploadedSet = new Set(sessionInfo.chunks.map((c) => c.chunkIndex));
        missingIndices = Array.from({ length: plan.totalChunks }, (_, i) => i).filter(
          (i) => !uploadedSet.has(i),
        );
      }
      if (sessionId) {
        console.log(`[ChunkUpload] Resumed session ${sessionId}, missing chunks:`, missingIndices);
      }
    } catch (err) {
      console.warn(`[ChunkUpload] Unable to resume session ${sessionId}, starting fresh:`, err);
      sessionId = undefined;
    }
  }

  if (!sessionId) {
    console.log(`[ChunkUpload] Initializing new upload session on backend: submissionId=${submissionId}, filename=${fileName}, chunks=${plan.totalChunks}, size=${plan.totalSizeBytes}`);
    const initResult = await initializeSurveyUpload(
      submissionId,
      {
        originalFilename: fileName,
        mediaType: 'VIDEO',
        totalChunks: plan.totalChunks,
        totalSizeBytes: plan.totalSizeBytes,
      },
      accessToken,
      signal,
    );
    sessionId = initResult.sessionId;
    missingIndices = Array.from({ length: plan.totalChunks }, (_, i) => i);
    console.log(`[ChunkUpload] Initialized video upload session: sessionId=${sessionId}`);
  }

  // 2. Upload missing chunks sequentially with fault isolation & strictly low RAM usage
  const totalChunks = plan.totalChunks;
  let completedCount = totalChunks - missingIndices.length;

  for (const chunkIndex of missingIndices) {
    if (signal?.aborted) throw new Error('Upload aborted by user.');

    const percent = Math.round((completedCount / totalChunks) * 85); // Video is 85% of total progress
    onProgress?.({
      currentChunk: chunkIndex + 1,
      totalChunks,
      percent,
      stage: 'uploading_video',
      statusText: `Uploading video chunk ${chunkIndex + 1}/${totalChunks} (${percent}%)...`,
    });

    console.log(`[ChunkUpload] Preparing chunk ${chunkIndex + 1}/${totalChunks}...`);
    const preparedChunk = await prepareVideoChunk({
      videoUri,
      chunkIndex,
      plan,
      fileName,
      sessionId: sessionId!,
    });

    try {
      console.log(`[ChunkUpload] Uploading chunk ${chunkIndex + 1}/${totalChunks} to sessionId=${sessionId}...`);
      await retryOperation(
        () => uploadSurveyChunk(sessionId!, preparedChunk.request, accessToken, signal),
        3,
        1200,
      );
      console.log(`[ChunkUpload] Chunk ${chunkIndex + 1}/${totalChunks} uploaded successfully.`);
    } catch (chunkErr) {
      console.error(`[ChunkUpload] Failed to upload chunk ${chunkIndex + 1}/${totalChunks}:`, chunkErr);
      throw chunkErr;
    } finally {
      if (preparedChunk.cleanup) {
        await preparedChunk.cleanup();
      }
    }

    completedCount += 1;
  }

  // 3. Complete video upload assembly
  console.log(`[ChunkUpload] All ${totalChunks} chunks uploaded. Completing video assembly for sessionId=${sessionId}...`);
  onProgress?.({
    currentChunk: totalChunks,
    totalChunks,
    percent: 88,
    stage: 'completing',
    statusText: 'Assembling video chunks on server...',
  });

  await retryOperation(
    () => completeSurveyUpload(sessionId!, accessToken, signal),
    2,
    1500,
  );
  console.log(`[ChunkUpload] Video assembly completed on server for sessionId=${sessionId}.`);

  // 4. Companion GPX Upload (Ensures Backend VIDEO_GPX contract validation passes)
  onProgress?.({
    currentChunk: totalChunks,
    totalChunks,
    percent: 92,
    stage: 'uploading_gpx',
    statusText: 'Attaching GPS telemetry...',
  });

  const gpxDescriptor = manualGpxUri
    ? { uri: manualGpxUri, name: manualGpxName ?? 'manual-survey.gpx' }
    : createCompanionGpxDescriptor({
        startCoordinate,
        endCoordinate,
        capturedAt,
        durationSeconds,
      });

  console.log(`[ChunkUpload] Preparing companion GPX telemetry:`, {
    isManual: Boolean(manualGpxUri),
    startCoordinate,
    endCoordinate,
    durationSeconds,
  });

  const preparedGpx = await prepareSurveyGpx(gpxDescriptor);

  console.log(`[ChunkUpload] Initializing GPX upload session: filename=${preparedGpx.fileName}, size=${preparedGpx.sizeBytes}`);
  const gpxInit = await initializeSurveyUpload(
    submissionId,
    {
      originalFilename: preparedGpx.fileName,
      mediaType: 'GPX',
      totalChunks: 1,
      totalSizeBytes: preparedGpx.sizeBytes,
    },
    accessToken,
    signal,
  );
  console.log(`[ChunkUpload] Initialized GPX session: sessionId=${gpxInit.sessionId}`);

  await uploadSurveyChunk(gpxInit.sessionId, preparedGpx.chunk, accessToken, signal);
  console.log(`[ChunkUpload] GPX chunk uploaded.`);

  await completeSurveyUpload(gpxInit.sessionId, accessToken, signal);
  console.log(`[ChunkUpload] GPX upload completed on server.`);

  onProgress?.({
    currentChunk: totalChunks,
    totalChunks,
    percent: 100,
    stage: 'completing',
    statusText: 'Upload completed successfully!',
  });

  console.log(`[ChunkUpload] PIPELINE FINISHED SUCCESSFULLY! VideoSession=${sessionId}, GpxSession=${gpxInit.sessionId}`);
  return {
    videoSessionId: sessionId!,
    gpxSessionId: gpxInit.sessionId,
  };
}
