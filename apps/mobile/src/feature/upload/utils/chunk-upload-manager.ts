import { Blob } from 'expo-blob';
import {
  completeSurveyUpload,
  getSurveyUploadSession,
  initializeSurveyUpload,
  uploadSurveyChunk,
} from '@/api/survey-submission/survey-submission';
import { calculateTemporalChunks, sliceVideoChunk } from './video-processor';
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

  onProgress?.({
    currentChunk: 0,
    totalChunks: 1,
    percent: 0,
    stage: 'preparing',
    statusText: 'Preparing video for chunk upload...',
  });

  // Read the source video Blob once
  const response = await fetch(videoUri);
  if (!response.ok && /^https?:/i.test(videoUri)) {
    throw new Error('Unable to read video for chunked upload.');
  }
  const arrayBuffer = await response.arrayBuffer();
  const fullBlob = new Blob([arrayBuffer], {
    type: response.headers.get('content-type') || 'video/mp4',
  });

  const fileName = videoFileName?.trim()
    || videoUri.split('/').pop()?.split('?')[0]
    || `survey-video-${Date.now()}.mp4`;

  const plan = calculateTemporalChunks(fullBlob.size, durationSeconds);

  // 1. Initialize or resume video upload session
  let sessionId = existingSessionId;
  let missingIndices: number[] = [];

  if (sessionId) {
    try {
      const sessionInfo = await getSurveyUploadSession(sessionId, accessToken, signal);
      if (sessionInfo.session.status === 'COMPLETED') {
        missingIndices = [];
      } else {
        const uploadedSet = new Set(sessionInfo.chunks.map((c) => c.chunkIndex));
        missingIndices = Array.from({ length: plan.totalChunks }, (_, i) => i).filter(
          (i) => !uploadedSet.has(i),
        );
      }
    } catch {
      sessionId = undefined;
    }
  }

  if (!sessionId) {
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
  }

  // 2. Upload missing chunks sequentially with fault isolation
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

    const chunkRequest = sliceVideoChunk(fullBlob, chunkIndex, plan, fileName);

    await retryOperation(
      () => uploadSurveyChunk(sessionId!, chunkRequest, accessToken, signal),
      3,
      1200,
    );

    completedCount += 1;
  }

  // 3. Complete video upload assembly
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

  const preparedGpx = await prepareSurveyGpx(gpxDescriptor);

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

  await uploadSurveyChunk(gpxInit.sessionId, preparedGpx.chunk, accessToken, signal);
  await completeSurveyUpload(gpxInit.sessionId, accessToken, signal);

  onProgress?.({
    currentChunk: totalChunks,
    totalChunks,
    percent: 100,
    stage: 'completing',
    statusText: 'Upload completed successfully!',
  });

  return {
    videoSessionId: sessionId!,
    gpxSessionId: gpxInit.sessionId,
  };
}
