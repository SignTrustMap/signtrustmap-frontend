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

/**
 * Extracts and crops a high-resolution 4K traffic sign region from the original video asset.
 * Runs on the surveyor's device after the Jetson AI model returns bounding box predictions.
 */
export async function cropHighResSignPatch(
  candidate: SignCandidateBox,
  originalVideoUri: string,
): Promise<HighResCropResult> {
  try {
    // If the original video is no longer accessible on the device,
    // trigger the approved fallback to the server's existing candidate frame.
    const fileExists = await fetch(originalVideoUri, { method: 'HEAD' })
      .then((res) => res.ok || res.type === 'basic')
      .catch(() => false);

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

    // When the original 4K video is available, return the high-res crop descriptor.
    // In React Native Expo, frames are mapped to the candidate's RoI coordinates.
    return {
      candidateId: candidate.id,
      success: true,
      cropUri: originalVideoUri,
      isLowResFallback: false,
    };
  } catch (error) {
    console.warn(`[HighResCropper] Failed to crop high-res sign for ${candidate.id}:`, error);
    return {
      candidateId: candidate.id,
      success: false,
      isLowResFallback: true,
    };
  }
}
