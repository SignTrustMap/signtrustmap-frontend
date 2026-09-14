import { Blob } from 'expo-blob';

import type { UploadChunkRequest } from '@/types/survey-submission/surveySubmissionType';

export type SurveyImage = {
  fileName?: string;
  mimeType?: string;
  type?: 'image' | 'video';
  uri: string;
};

export type SurveyGpx = {
  name?: string;
  uri: string;
};

function imageMimeType(fileName: string, preferred?: string) {
  if (preferred?.startsWith('image/') || preferred?.startsWith('video/')) return preferred;
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  if (extension === 'mp4') return 'video/mp4';
  if (extension === 'mov') return 'video/quicktime';
  if (extension === 'mkv') return 'video/x-matroska';
  return 'image/jpeg';
}

/** Read the selected media and prepare a Blob accepted by Expo and browser FormData. */
export async function prepareSurveyImage(image: SurveyImage) {
  const response = await fetch(image.uri);
  if (/^https?:/i.test(image.uri) && !response.ok) {
    throw new Error('The selected media could not be read.');
  }
  // Avoid Response.blob()'s React Native native-store/base64 fallback.
  const blob = new Blob([await response.arrayBuffer()], {
    type: response.headers.get('content-type') ?? '',
  });
  if (blob.size < 1) throw new Error('The selected media is empty.');

  const isVideo = image.type === 'video';
  const fileName = image.fileName?.trim()
    || image.uri.split('/').pop()?.split('?')[0]
    || `survey-${isVideo ? 'video' : 'sign'}-${Date.now()}.${isVideo ? 'mp4' : 'jpg'}`;
  const mimeType = imageMimeType(fileName, image.mimeType || blob.type);
  const chunk: UploadChunkRequest = {
    chunkIndex: 0,
    fileName,
    // Expo's FormData only applies the filename argument to the global Blob.
    // Supply a name explicitly for expo-blob on native as well.
    // expo-blob's bytes() uses ArrayBufferLike; DOM types require ArrayBuffer.
    file: Object.assign(blob.slice(0, blob.size, mimeType), { name: fileName }) as unknown as globalThis.Blob,
  };

  return { fileName, sizeBytes: blob.size, chunk };
}

/** Read the selected GPX file and prepare a Blob for GPX media upload. */
export async function prepareSurveyGpx(gpx: SurveyGpx) {
  const response = await fetch(gpx.uri);
  if (/^https?:/i.test(gpx.uri) && !response.ok) {
    throw new Error('The selected GPX file could not be read.');
  }
  const blob = new Blob([await response.arrayBuffer()], {
    type: 'application/gpx+xml',
  });
  if (blob.size < 1) throw new Error('The selected GPX file is empty.');

  const fileName = gpx.name?.trim()
    || gpx.uri.split('/').pop()?.split('?')[0]
    || `track-${Date.now()}.gpx`;

  const chunk: UploadChunkRequest = {
    chunkIndex: 0,
    fileName,
    file: Object.assign(blob.slice(0, blob.size, 'application/gpx+xml'), { name: fileName }) as unknown as globalThis.Blob,
  };

  return { fileName, sizeBytes: blob.size, chunk };
}
