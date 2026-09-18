import type { UploadChunkRequest } from '@/types/survey-submission/surveySubmissionType';

export const MAX_BACKEND_CHUNK_BYTES = 45 * 1024 * 1024; // 45 MB safety margin under backend's 50MB limit
export const DEFAULT_1MIN_CHUNK_BYTES = 10 * 1024 * 1024; // 10 MB estimated for 1 min of 640p/720p

export type ChunkPlan = {
  totalChunks: number;
  chunkSize: number;
  totalSizeBytes: number;
  durationSeconds: number;
};

/**
 * Calculates temporal 1-minute chunks for an up to 8-hour survey video.
 * Adheres directly to the Scenario #1 Demonstration specification:
 * - Temporal chunk: 1 minute (< 60s upload time)
 * - Maximum video duration: 8 hours (28,800s)
 * - Low storage overhead: 1 chunk in memory at a time
 */
export function calculateTemporalChunks(
  fileSizeBytes: number,
  durationSeconds = 60,
): ChunkPlan {
  const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? Math.min(28800, durationSeconds) // Cap at 8 hours
    : 60;

  // 1 minute per temporal chunk
  let totalChunks = Math.max(1, Math.ceil(safeDuration / 60));
  let chunkSize = Math.ceil(fileSizeBytes / totalChunks);

  // Guarantee that chunk size does not exceed the backend limit (50 MB)
  if (chunkSize > MAX_BACKEND_CHUNK_BYTES) {
    totalChunks = Math.ceil(fileSizeBytes / MAX_BACKEND_CHUNK_BYTES);
    chunkSize = Math.ceil(fileSizeBytes / totalChunks);
  }

  // Backend limit: MAX_CHUNKS_PER_SESSION = 5000
  if (totalChunks > 5000) {
    totalChunks = 5000;
    chunkSize = Math.ceil(fileSizeBytes / totalChunks);
  }

  return {
    totalChunks,
    chunkSize,
    totalSizeBytes: fileSizeBytes,
    durationSeconds: safeDuration,
  };
}

/**
 * Slices an on-demand single chunk from a video Blob.
 * Only the requested chunk is held in memory for immediate transmission,
 * keeping mobile memory and storage overhead strictly low.
 */
export function sliceVideoChunk(
  fullBlob: { slice: (start?: number, end?: number, contentType?: string) => any },
  chunkIndex: number,
  plan: ChunkPlan,
  fileName: string,
  mimeType = 'video/mp4',
): UploadChunkRequest {
  const startByte = chunkIndex * plan.chunkSize;
  const endByte = Math.min(plan.totalSizeBytes, (chunkIndex + 1) * plan.chunkSize);

  const chunkBlob = fullBlob.slice(startByte, endByte, mimeType);
  const namedChunk = Object.assign(chunkBlob, { name: `${fileName}.part_${chunkIndex}` });

  return {
    chunkIndex,
    fileName: `${fileName}.part_${chunkIndex}`,
    file: namedChunk as unknown as globalThis.Blob,
  };
}
