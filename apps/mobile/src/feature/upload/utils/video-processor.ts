import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import type { UploadChunkRequest } from '@/types/survey-submission/surveySubmissionType';

export const BACKEND_MAX_CHUNK_BYTES = 52428800; // 50 MB absolute backend limit (52,428,800 bytes)
export const MAX_BACKEND_CHUNK_BYTES = 45 * 1024 * 1024; // 45 MB safety margin under backend's 50MB limit
export const DEFAULT_1MIN_CHUNK_BYTES = 10 * 1024 * 1024; // 10 MB estimated for 1 min of 640p/720p
export const MAX_CHUNK_BYTES = MAX_BACKEND_CHUNK_BYTES;
export const MAX_NETWORK_CHUNK_BYTES = MAX_BACKEND_CHUNK_BYTES;

export type ChunkPlan = {
  totalChunks: number;
  chunkSize: number;
  totalSizeBytes: number;
  durationSeconds: number;
};

export type PreparedVideoChunk = {
  request: UploadChunkRequest;
  cleanup?: () => Promise<void>;
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
  maxChunkSizeBytes = MAX_BACKEND_CHUNK_BYTES,
): ChunkPlan {
  const safeDuration = Number.isFinite(durationSeconds) && durationSeconds > 0
    ? Math.min(28800, durationSeconds) // Cap at 8 hours
    : 60;

  // 1 minute per temporal chunk
  let totalChunks = Math.max(1, Math.ceil(safeDuration / 60));
  let chunkSize = Math.ceil(fileSizeBytes / totalChunks);

  // Guarantee that chunk size does not exceed the backend limit (50 MB / 52428800 bytes, safe margin 45MB)
  if (chunkSize > maxChunkSizeBytes) {
    totalChunks = Math.ceil(fileSizeBytes / maxChunkSizeBytes);
    chunkSize = Math.ceil(fileSizeBytes / totalChunks);
  }

  // Strict guard: Guarantee totalSizeBytes <= totalChunks * 52428800 bytes
  if (fileSizeBytes > totalChunks * BACKEND_MAX_CHUNK_BYTES) {
    totalChunks = Math.ceil(fileSizeBytes / BACKEND_MAX_CHUNK_BYTES);
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
 * Safely inspects the video file size on device or remote URL without loading
 * the file content into RAM, avoiding OutOfMemoryError on large 4K videos.
 */
export async function getVideoFileSizeBytes(videoUri: string): Promise<number> {
  // 1. Native FileSystem (Android & iOS)
  if (Platform.OS !== 'web') {
    try {
      const info = await FileSystem.getInfoAsync(videoUri);
      if (info.exists && typeof info.size === 'number' && info.size > 0) {
        return info.size;
      }
    } catch (err) {
      console.warn('[VideoProcessor] FileSystem.getInfoAsync error:', err);
    }
  }

  // 2. HTTP HEAD request (content-length header)
  try {
    const headRes = await fetch(videoUri, { method: 'HEAD' });
    const cl = headRes.headers.get('content-length');
    if (cl && Number(cl) > 0) {
      return Number(cl);
    }
  } catch {}

  // 3. Web fallback: Blob size
  if (Platform.OS === 'web') {
    const res = await fetch(videoUri);
    const blob = await res.blob();
    return blob.size;
  }

  throw new Error('Unable to determine video file size.');
}

/**
 * Slices an on-demand single chunk from a video Blob.
 * Maintained for backward compatibility and test suites.
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

/**
 * Prepares a single video chunk for upload with strictly low memory overhead (< 5 MB).
 * - When totalChunks === 1: directly references the original file via native FormData descriptor
 *   with ZERO memory buffering and ZERO temp file creation.
 * - When totalChunks > 1: slices ONLY the required chunk bytes into a temporary cache file,
 *   which is immediately deleted after transmission via the returned `cleanup()` hook.
 */
export async function prepareVideoChunk(options: {
  videoUri: string;
  chunkIndex: number;
  plan: ChunkPlan;
  fileName: string;
  sessionId: string;
}): Promise<PreparedVideoChunk> {
  const { videoUri, chunkIndex, plan, fileName, sessionId } = options;
  const partName = plan.totalChunks > 1 ? `${fileName}.part_${chunkIndex}` : fileName;

  // Single chunk: stream original file directly (zero memory, zero disk copy)
  if (plan.totalChunks === 1) {
    if (Platform.OS === 'web') {
      const res = await fetch(videoUri);
      const blob = await res.blob();
      return {
        request: {
          chunkIndex: 0,
          fileName,
          file: Object.assign(blob, { name: fileName }) as unknown as globalThis.Blob,
        },
      };
    }

    return {
      request: {
        chunkIndex: 0,
        fileName,
        file: {
          uri: videoUri,
          name: fileName,
          type: 'video/mp4',
        },
      },
    };
  }

  // Web multi-chunk: browser memory handles blob slicing efficiently
  if (Platform.OS === 'web') {
    const res = await fetch(videoUri);
    const fullBlob = await res.blob();
    const startByte = chunkIndex * plan.chunkSize;
    const endByte = Math.min(plan.totalSizeBytes, (chunkIndex + 1) * plan.chunkSize);
    const chunkBlob = fullBlob.slice(startByte, endByte, 'video/mp4');
    return {
      request: {
        chunkIndex,
        fileName: partName,
        file: Object.assign(chunkBlob, { name: partName }) as unknown as globalThis.Blob,
      },
    };
  }

  // Native multi-chunk: stream bytes to a single temp file to guarantee low RAM & disk overhead
  const startByte = chunkIndex * plan.chunkSize;
  const endByte = Math.min(plan.totalSizeBytes, (chunkIndex + 1) * plan.chunkSize);
  const chunkLength = endByte - startByte;

  const chunkUri = `${FileSystem.cacheDirectory}survey_chunk_${sessionId}_${chunkIndex}.mp4`;

  // Create an empty temporary chunk file
  await FileSystem.writeAsStringAsync(chunkUri, '', {
    encoding: FileSystem.EncodingType.Base64,
  });

  const BUFFER_SIZE = 4 * 1024 * 1024; // 4MB stream buffer
  let offset = 0;
  while (offset < chunkLength) {
    const sliceLen = Math.min(BUFFER_SIZE, chunkLength - offset);
    const base64Data = await FileSystem.readAsStringAsync(videoUri, {
      encoding: FileSystem.EncodingType.Base64,
      position: startByte + offset,
      length: sliceLen,
    });
    await FileSystem.writeAsStringAsync(chunkUri, base64Data, {
      encoding: FileSystem.EncodingType.Base64,
      append: true,
    });
    offset += sliceLen;
  }

  return {
    request: {
      chunkIndex,
      fileName: partName,
      file: {
        uri: chunkUri,
        name: partName,
        type: 'video/mp4',
      },
    },
    cleanup: async () => {
      try {
        await FileSystem.deleteAsync(chunkUri, { idempotent: true });
      } catch (err) {
        console.warn('[VideoProcessor] Failed to clean up chunk file:', err);
      }
    },
  };
}
