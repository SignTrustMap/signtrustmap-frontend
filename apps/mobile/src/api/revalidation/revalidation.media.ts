import * as FileSystem from 'expo-file-system/legacy';

import { compressAndResizeSurveyImage } from '@/feature/upload/utils/survey-image';
import { getStorageItemAsync } from '@/hooks/use-storage';
import type {
  RevalidationEvidenceType,
  SubmitRevalidationEvidenceDto,
} from '@/types/revalidationType';

export type EvidenceMediaFile = {
  uri: string;
  fileName?: string;
  mimeType?: string;
};

/**
 * Converts a local file URI (e.g. file://, content://, cache) to a standard Blob
 * compatible with WinterCG fetch and React Native FormData.
 */
export async function uriToBlob(uri: string, mimeType = 'image/jpeg'): Promise<Blob> {
  try {
    const res = await fetch(uri);
    const blob = await res.blob();
    if (!blob.type || blob.type === 'text/plain') {
      return new Blob([blob], { type: mimeType });
    }
    return blob;
  } catch (fetchErr) {
    console.warn('[Revalidation] fetch uri to blob failed, falling back to FileSystem base64:', fetchErr);
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const binary =
      typeof atob === 'function' ? atob(base64) : Buffer.from(base64, 'base64').toString('binary');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }
}

/**
 * Reads the JWT access token that SessionProvider stores under 'session'.
 */
export async function getStoredAccessToken(): Promise<string | undefined> {
  try {
    const raw = await getStorageItemAsync('session');
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed?.accessToken || undefined;
  } catch {
    return undefined;
  }
}

export function resolveEvidenceType(data: SubmitRevalidationEvidenceDto): RevalidationEvidenceType {
  if (data.evidenceType) return data.evidenceType;
  if (data.condition === 'REMOVED' || data.condition === 'MISSING') return 'REMOVED';
  if (data.condition === 'CHANGED' || data.condition === 'REPLACED') return 'CHANGED';
  return 'STILL_ACTIVE';
}

export async function prepareUploadEvidenceMedia(
  mediaFile?: EvidenceMediaFile,
): Promise<EvidenceMediaFile | undefined> {
  if (
    !mediaFile?.uri ||
    mediaFile.mimeType?.startsWith('video/') ||
    mediaFile.uri.startsWith('http://') ||
    mediaFile.uri.startsWith('https://')
  ) {
    return mediaFile;
  }

  try {
    const compressed = await compressAndResizeSurveyImage(mediaFile.uri);
    if (compressed.uri) {
      return {
        ...mediaFile,
        uri: compressed.uri,
        fileName: mediaFile.fileName
          ? !mediaFile.fileName.toLowerCase().endsWith('.jpg') &&
            !mediaFile.fileName.toLowerCase().endsWith('.jpeg')
            ? `${mediaFile.fileName.replace(/\.[^/.]+$/, '')}.jpg`
            : mediaFile.fileName
          : 'evidence.jpg',
        mimeType: 'image/jpeg',
      };
    }
  } catch (compErr) {
    console.warn('[Revalidation] Image downsize skipped or failed, using original:', compErr);
  }
  return mediaFile;
}

export function buildEvidenceParameters(
  data: SubmitRevalidationEvidenceDto,
  evidenceType: RevalidationEvidenceType,
): Record<string, string> {
  const parameters: Record<string, string> = {
    latitude: String(data.latitude),
    longitude: String(data.longitude),
  };
  if (evidenceType) parameters.evidenceType = evidenceType;
  if (
    typeof data.accuracyMeters === 'number' &&
    Number.isFinite(data.accuracyMeters) &&
    data.accuracyMeters >= 0
  ) {
    parameters.accuracyMeters = String(Math.round(data.accuracyMeters * 10) / 10);
  }
  if (data.capturedAt) {
    const parsedTime = new Date(data.capturedAt).getTime();
    parameters.capturedAt = !Number.isNaN(parsedTime)
      ? new Date(parsedTime).toISOString()
      : data.capturedAt;
  }
  if (data.confirmedSignId) {
    parameters.confirmedSignId = data.confirmedSignId;
  }
  if (
    typeof data.headingDegrees === 'number' &&
    Number.isFinite(data.headingDegrees) &&
    data.headingDegrees >= 0 &&
    data.headingDegrees <= 360
  ) {
    parameters.headingDegrees = String(Math.round(data.headingDegrees));
  }
  if (typeof data.isLiveCapture === 'boolean') {
    parameters.isLiveCapture = String(data.isLiveCapture);
  }
  if (data.suggestedSignTypeId != null && !Number.isNaN(Number(data.suggestedSignTypeId))) {
    parameters.suggestedSignTypeId = String(Math.round(Number(data.suggestedSignTypeId)));
  }
  if (data.mediaUrl) {
    parameters.mediaUrl = data.mediaUrl;
  }
  return parameters;
}

export async function buildEvidenceFormData(
  data: SubmitRevalidationEvidenceDto,
  evidenceType: RevalidationEvidenceType,
  uploadMediaFile?: EvidenceMediaFile,
): Promise<FormData> {
  const formData = new FormData();
  const params = buildEvidenceParameters(data, evidenceType);
  for (const [key, val] of Object.entries(params)) {
    if (key === 'mediaUrl') continue;
    formData.append(key, val);
  }

  if (uploadMediaFile) {
    if (typeof File !== 'undefined' && (uploadMediaFile as unknown) instanceof File) {
      formData.append('file', uploadMediaFile as unknown as Blob);
    } else if (
      uploadMediaFile.uri &&
      (uploadMediaFile.uri.startsWith('blob:') || uploadMediaFile.uri.startsWith('data:'))
    ) {
      const blob = await fetch(uploadMediaFile.uri).then((r) => r.blob());
      formData.append('file', blob, uploadMediaFile.fileName || 'evidence.jpg');
    } else if (
      uploadMediaFile.uri &&
      (uploadMediaFile.uri.startsWith('http://') || uploadMediaFile.uri.startsWith('https://'))
    ) {
      formData.append('mediaUrl', uploadMediaFile.uri);
    } else if (uploadMediaFile.uri) {
      try {
        const blob = await uriToBlob(
          uploadMediaFile.uri,
          uploadMediaFile.mimeType || 'image/jpeg',
        );
        formData.append('file', blob, uploadMediaFile.fileName || 'evidence.jpg');
      } catch (blobErr) {
        console.warn('[Revalidation] uriToBlob fallback to object descriptor:', blobErr);
        formData.append('file', {
          uri: uploadMediaFile.uri,
          name: uploadMediaFile.fileName || 'evidence.jpg',
          type: uploadMediaFile.mimeType || 'image/jpeg',
        } as any);
      }
    }
  } else if (data.mediaUrl) {
    formData.append('mediaUrl', data.mediaUrl);
  }

  return formData;
}
