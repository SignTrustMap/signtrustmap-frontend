import { Blob } from 'expo-blob';

import type { UploadChunkRequest } from '@/types/survey-submission/surveySubmissionType';

export type SurveyImage = {
  fileName?: string;
  mimeType?: string;
  uri: string;
};

function imageMimeType(fileName: string, preferred?: string) {
  if (preferred?.startsWith('image/')) return preferred;
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'png') return 'image/png';
  if (extension === 'webp') return 'image/webp';
  if (extension === 'heic' || extension === 'heif') return 'image/heic';
  return 'image/jpeg';
}

/** Read the selected image and prepare a Blob accepted by Expo and browser FormData. */
export async function prepareSurveyImage(image: SurveyImage) {
  const response = await fetch(image.uri);
  if (/^https?:/i.test(image.uri) && !response.ok) {
    throw new Error('The selected image could not be read.');
  }
  // Avoid Response.blob()'s React Native native-store/base64 fallback.
  const blob = new Blob([await response.arrayBuffer()], {
    type: response.headers.get('content-type') ?? '',
  });
  if (blob.size < 1) throw new Error('The selected image is empty.');

  const fileName = image.fileName?.trim()
    || image.uri.split('/').pop()?.split('?')[0]
    || `survey-sign-${Date.now()}.jpg`;
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
