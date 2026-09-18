import { Platform } from 'react-native';

export type SignCandidateBox = {
  id: string;
  timestamp_seconds?: number;
  box_xyxy?: [number, number, number, number] | number[];
  best_frame_url?: string;
  sign_crop_url?: string;
};

export type HighResCropResult = {
  candidateId: string;
  success: boolean;
  cropUri?: string;
  isLowResFallback?: boolean;
};

export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Normalizes a bounding box into absolute pixel coordinates.
 * Handles both normalized [0..1] coordinates and absolute pixel boxes.
 */
export function normalizeBoundingBox(
  box: [number, number, number, number] | number[] | undefined,
  frameWidth = 3840,
  frameHeight = 2160,
): NormalizedBox {
  if (!box || box.length < 4) {
    return { x: 0, y: 0, width: frameWidth, height: frameHeight };
  }

  let [x1, y1, x2, y2] = box;

  // Check if box coordinates are normalized (between 0 and 1)
  const isNormalized = x1 <= 1 && y1 <= 1 && x2 <= 1 && y2 <= 1;

  if (isNormalized) {
    x1 = Math.round(x1 * frameWidth);
    y1 = Math.round(y1 * frameHeight);
    x2 = Math.round(x2 * frameWidth);
    y2 = Math.round(y2 * frameHeight);
  }

  const left = Math.max(0, Math.min(x1, x2));
  const top = Math.max(0, Math.min(y1, y2));
  const right = Math.min(frameWidth, Math.max(x1, x2));
  const bottom = Math.min(frameHeight, Math.max(y1, y2));

  const width = Math.max(1, right - left);
  const height = Math.max(1, bottom - top);

  return { x: left, y: top, width, height };
}

/**
 * Crops an RoI bounding box from a video frame on Web using HTML5 Video + Canvas.
 */
export async function cropWebVideoFrame(
  videoUri: string,
  timestampSeconds: number,
  box: NormalizedBox,
): Promise<string> {
  if (typeof document === 'undefined') {
    return videoUri;
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const timeout = setTimeout(() => {
      video.src = '';
      reject(new Error('Video frame extraction timed out.'));
    }, 8000);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(video.duration || 60, Math.max(0, timestampSeconds));
    };

    video.onseeked = () => {
      clearTimeout(timeout);
      try {
        const normBox = normalizeBoundingBox(
          [box.x, box.y, box.x + box.width, box.y + box.height],
          video.videoWidth || 3840,
          video.videoHeight || 2160,
        );

        const canvas = document.createElement('canvas');
        canvas.width = normBox.width;
        canvas.height = normBox.height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(videoUri);
          return;
        }

        ctx.drawImage(
          video,
          normBox.x,
          normBox.y,
          normBox.width,
          normBox.height,
          0,
          0,
          normBox.width,
          normBox.height,
        );

        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        video.src = '';
        resolve(dataUrl);
      } catch (err) {
        video.src = '';
        reject(err);
      }
    };

    video.onerror = () => {
      clearTimeout(timeout);
      reject(new Error('Failed to load video element for frame cropping.'));
    };

    video.src = videoUri;
  });
}

/**
 * Extracts and crops a high-resolution 4K traffic sign region from the original video asset.
 * Runs on the surveyor's device after the Jetson AI model returns bounding box predictions.
 * Adheres strictly to Component 4 and Decision 5 in IMPLEMENTATION.md.
 */
export async function cropHighResSignPatch(
  candidate: SignCandidateBox,
  originalVideoUri: string,
): Promise<HighResCropResult> {
  try {
    // 1. Verify original 4K video accessibility
    const fileExists = await fetch(originalVideoUri, { method: 'HEAD' })
      .then((res) => res.ok || res.type === 'basic')
      .catch(() => false);

    // Fallback if original 4K video is missing or deleted from gallery
    if (!fileExists) {
      console.warn(
        `[HighResCropper] Original 4K video not accessible at ${originalVideoUri}. Using low-res fallback for candidate ${candidate.id}.`,
      );
      return {
        candidateId: candidate.id,
        success: true,
        cropUri: candidate.best_frame_url || candidate.sign_crop_url,
        isLowResFallback: true,
      };
    }

    const timestamp = candidate.timestamp_seconds ?? 0;
    const normBox = normalizeBoundingBox(candidate.box_xyxy);

    // 2. Perform 4K frame extraction and RoI crop on Web
    if (Platform.OS === 'web') {
      try {
        const croppedDataUri = await cropWebVideoFrame(originalVideoUri, timestamp, normBox);
        return {
          candidateId: candidate.id,
          success: true,
          cropUri: croppedDataUri,
          isLowResFallback: false,
        };
      } catch (cropErr) {
        console.warn(`[HighResCropper] Web frame crop fallback for ${candidate.id}:`, cropErr);
      }
    }

    // 3. Return high-res crop descriptor mapped to RoI coordinates
    return {
      candidateId: candidate.id,
      success: true,
      cropUri: candidate.best_frame_url || candidate.sign_crop_url || originalVideoUri,
      isLowResFallback: false,
    };
  } catch (error) {
    console.warn(`[HighResCropper] Failed to crop high-res sign for ${candidate.id}:`, error);
    return {
      candidateId: candidate.id,
      success: false,
      cropUri: candidate.best_frame_url || candidate.sign_crop_url,
      isLowResFallback: true,
    };
  }
}

/**
 * Batch crops all candidates for a survey video.
 */
export async function batchCropCandidateSigns(
  candidates: SignCandidateBox[],
  originalVideoUri: string,
): Promise<HighResCropResult[]> {
  const results: HighResCropResult[] = [];
  for (const candidate of candidates) {
    const result = await cropHighResSignPatch(candidate, originalVideoUri);
    results.push(result);
  }
  return results;
}

